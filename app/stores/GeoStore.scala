package stores

import com.google.inject.ImplementedBy
import edu.rpi.tw.twks.uri.Uri
import io.github.tetherlessworld.twxplore.lib.geo.models.domain.{Feature, Geometry}

@ImplementedBy(classOf[TwksGeoStore])
trait GeoStore {
  def getFeatures(limit: Int, offset: Int): List[Feature]

  def getFeaturesCount(): Int

  def getFeatureByUri(featureUri: Uri): Feature

  def getFeaturesContaining(geometry: Geometry): List[Feature]

  def getFeaturesWithin(geometry: Geometry): List[Feature]
}