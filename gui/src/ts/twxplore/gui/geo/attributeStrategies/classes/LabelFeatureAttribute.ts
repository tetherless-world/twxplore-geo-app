import {FeatureAttribute} from "./FeatureAttribute";
import {FeatureAttributeName} from "../states/map/FeatureAttributeName";
import {FilterType} from "../states/map/FilterType";
import {TypeOfFeatureAttribute} from "../states/map/TypeOfFeatureAttribute";
import {FieldType} from "../states/map/FieldType";

export class LabelFeatureAttribute implements FeatureAttribute {
  static readonly instance = new LabelFeatureAttribute();
  readonly name = FeatureAttributeName.label;
  readonly filterType = FilterType.MULTISELECT;
  readonly fieldType = FieldType.STRING;
  readonly ignore = false;
  readonly typeOf = TypeOfFeatureAttribute.STRING;
}