package stores

import edu.rpi.tw.twks.api.TwksClient
import edu.rpi.tw.twks.uri.Uri
import io.github.tetherlessworld.scena.Rdf
import io.github.tetherlessworld.twxplore.lib.base.stores.BaseTwksStore
import io.github.tetherlessworld.twxplore.lib.geo.models.domain.Feature
import javax.inject.Inject
import models.graphql.FeatureQuery
import org.apache.jena.geosparql.implementation.vocabulary.{Geo, GeoSPARQL_URI}
import org.apache.jena.query.QueryFactory
import org.apache.jena.vocabulary.RDF
import play.api.Configuration

import scala.collection.JavaConverters._

final class TwksGeoStore(twksClient: TwksClient) extends BaseTwksStore(twksClient) with GeoStore {
  private val PREFIXES =
    s"""
       |PREFIX geo: <${GeoSPARQL_URI.GEO_URI}>
       |PREFIX geof: <${GeoSPARQL_URI.GEOF_URI}>
       |PREFIX rdf: <${RDF.getURI}>
       |PREFIX sf: <${GeoSPARQL_URI.SF_URI}>
       |""".stripMargin

  @Inject
  def this(configuration: Configuration) = this(BaseTwksStore.createTwksClient(configuration))

  override def getFeatures(limit: Int, offset: Int, query: FeatureQuery): List[Feature] =
    getFeaturesByUris(getFeatureUris(limit = limit, offset = offset, query = query))

  override def getFeaturesCount(query: FeatureQuery): Int = {
    withAssertionsQueryExecution(QueryFactory.create(
      s"""
         |${PREFIXES}
         |SELECT (COUNT(DISTINCT ?feature) AS ?count)
         |WHERE {
         |${toWherePatterns(query).mkString("\n")}
         |}
         |""".stripMargin)) {
      queryExecution =>
        queryExecution.execSelect().next().get("count").asLiteral().getInt
    }
  }

  def getFeatureByUri(featureUri: Uri): Feature =
    getFeaturesByUris(List(featureUri)).head

  private def getFeaturesByUris(featureUris: List[Uri]): List[Feature] = {
    // Should be safe to inject featureUris since they've already been parsed as URIs
    withAssertionsQueryExecution(QueryFactory.create(
      s"""
         |${PREFIXES}
         |CONSTRUCT {
         |  ?feature ?featureP ?featureO .
         |  ?geometry ?geometryP ?geometryO .
         |} WHERE {
         |  VALUES ?feature { ${featureUris.map(featureUri => "<" + featureUri.toString() + ">").mkString(" ")} }
         |  ?feature geo:hasDefaultGeometry ?geometry .
         |  ?feature ?featureP ?featureO .
         |  ?geometry ?geometryP ?geometryO .
         |}
         |""".stripMargin)) { queryExecution =>
      val model = queryExecution.execConstruct()
      model.listSubjectsWithProperty(RDF.`type`, Geo.FEATURE_RES).asScala.toList.map(resource => Rdf.read[Feature](resource))
    }
  }

  private def getFeatureUris(limit: Int, offset: Int, query: FeatureQuery): List[Uri] = {
    withAssertionsQueryExecution(QueryFactory.create(
      s"""
         |${PREFIXES}
         |SELECT DISTINCT ?feature WHERE {
         |  ${toWherePatterns(query).mkString("\n")}
         |} LIMIT $limit OFFSET $offset
         |""".stripMargin)) {
      queryExecution =>
        queryExecution.execSelect().asScala.toList.map(querySolution => Uri.parse(querySolution.get("feature").asResource().getURI))
    }
  }

  private def toWherePatterns(query: FeatureQuery): List[String] =
    List(
      "?feature rdf:type geo:Feature .",
      "?feature geo:hasDefaultGeometry ?geometry .",
      "?geometry rdf:type sf:Geometry .",
      "?geometry geo:asWKT ?wkt ."
    ) ++
      // Features that contain the given WKT
      // sfContains: Exists if the subject SpatialObject spatially contains the object SpatialObject. DE-9IM: T*****FF*
      query.containsWkt.map(wkt => s"""FILTER(geof:sfContains(?wkt, "${wkt}"^^geo:wktLiteral))""").toList ++
      query.`type`.map(`type` => s"?feature rdf:type <${`type`.uri.toString}> .").toList ++
      // Features within the given WKT
      // sfWithin: Exists if the subject SpatialObject is spatially within the object SpatialObject. DE-9IM: T*F**F***
      query.withinWkt.map(wkt => s"""FILTER(geof:sfWithin(?wkt, "${wkt}"^^geo:wktLiteral))""").toList
}
