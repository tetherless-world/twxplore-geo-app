package models.domain

import models.GeoTestData

class FeatureSpec extends DomainModelSpec {
  "The Feature companion object" should {
    "serialize and deserialize Features" in {
      testSerialization(GeoTestData.feature)
      testSerialization(GeoTestData.containedFeature)
      testSerialization(GeoTestData.containingFeature)
      testSerialization(GeoTestData.featureWithRanges)
    }
  }
}
