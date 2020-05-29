import {FeatureAttributeName} from "../../../states/map/FeatureAttributeName";
import {KeplerFilterType} from "../../../states/map/KeplerFilterType";
import {NumericFeatureAttributeStrategy} from "./NumericFeatureAttributeStrategy";
import {MapFeatureAttributeNumericRange} from "../../../states/map/MapFeatureAttributeState/MapNumericFeatureAttributeState";

export class TimestampFeatureAttributeStrategy extends NumericFeatureAttributeStrategy {
  getAttributeChipLabel(
    currentRangeOfAttributeOfFeatureType: MapFeatureAttributeNumericRange
  ): string {
    const minDateString = new Date(
      currentRangeOfAttributeOfFeatureType.min * 1000
    ).toLocaleDateString("en-US");
    const maxDateString = new Date(
      currentRangeOfAttributeOfFeatureType.max * 1000
    ).toLocaleDateString("en-US");

    return "timestamp Range: " + minDateString + " - " + maxDateString;
  }
  static readonly instance = new TimestampFeatureAttributeStrategy();
  readonly name = FeatureAttributeName.timestamp;
  readonly keplerFilterType = KeplerFilterType.TIMERANGE;
}
