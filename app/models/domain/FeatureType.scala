package models.domain

import edu.rpi.tw.twks.uri.Uri

sealed trait FeatureType {
  def uri = Uri.parse("http://twxplore.github.io/app/geo/ontology#" + toString)
}

object FeatureType {

  case object County extends FeatureType
  case object MetropolitanDivision extends FeatureType
  case object MilitaryInstallation extends FeatureType
  case object Policy extends FeatureType
  case object Root extends FeatureType
  case object State extends FeatureType
  case object Transmission extends FeatureType
  case object Transmitter extends FeatureType

  val values = List(County, MetropolitanDivision, MilitaryInstallation, Root, Transmission, Transmitter, State)
}
