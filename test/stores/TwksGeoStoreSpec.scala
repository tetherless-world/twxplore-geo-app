package stores

import io.github.tetherlessworld.twxplore.lib.geo.models.domain.TestData
import org.scalatest.{Matchers, WordSpec}

class TwksGeoStoreSpec extends WordSpec with Matchers {
  "Twks Store" can {
    val currentGeometry = TestData.geometry
    val currentUri = TestData.feature.uri

    "a valid URI" should {
      "return a valid feature" in {
        val feature = TestGeoStore.getFeatureByUri(currentUri)
        feature should equal(TestData.feature)
      }
    }

    "a valid geometry" should {
      "return a valid feature list" in {
        val featureList = TestGeoStore.getFeaturesContaining(currentGeometry)
        featureList should equal(List(TestData.feature))
      }
    }

    "an invalid geometry" should {
      "return an empty feature list" in {
        val featureList = TestGeoStore.getFeaturesContaining(null)
        featureList should equal(List())
      }
    }

    "an invalid URI" should {
      "produce NoSuchElementException" in {
        intercept[NoSuchElementException] {
          TestGeoStore.getFeatureByUri(null)
        }
      }
    }
  }

}

