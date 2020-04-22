import {FeatureAttribute} from "./FeatureAttribute";
import {FeatureAttributeName} from "../states/map/FeatureAttributeName";
import {FilterType} from "../states/map/FilterType";

export class LocalityFeatureAttribute implements FeatureAttribute {
  static readonly instance = new LocalityFeatureAttribute();

  readonly isNumeric = false;
  readonly name = FeatureAttributeName.label;
  readonly isString = true;
  readonly filterType = FilterType.MULTISELECT;
  readonly ignore = false;
}
