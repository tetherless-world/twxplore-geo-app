import * as React from "react";
import {makeStyles, Theme, createStyles} from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import {connect, useSelector, useDispatch} from "react-redux";
import {MapState} from "../../states/map/MapState";
import {RootState} from "../../states/root/RootState";
import {setFilter} from "kepler.gl/actions";
import {getFeatureAttributeByName} from "../../attributeStrategies/getFeatureAttributeByName";
import {MapFeatureTypeState} from "../../states/map/MapFeatureTypeState";
import {allFiltersSet} from "../../actions/map/AllFiltersSetAction";
import {FeatureType} from "../../api/graphqlGlobalTypes";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: 300,
    },
    margin: {
      height: theme.spacing(3),
    },
  })
);

function valuetext(value: number) {
  return `${value}`;
}

const FilterSlidersImpl: React.FunctionComponent<{featureType: string}> = ({
  featureType,
}) => {
  const classes = useStyles();
  const state: MapState = useSelector(
    (rootState: RootState) => rootState.app.map
  );

  const featureTypeState = state.featuresByType[featureType].featureTypeState;
  const featureTypeAttributeState =
    state.featuresByType[featureType].attributeStates;
  const dispatch = useDispatch();
  const handleChange = (
    event: any,
    newValue: number | number[],
    attribute: string,
    idx: number
  ) => {
    dispatch(setFilter(idx, "value", newValue));
  };

  return (
    <div className={classes.root}>
      <div className={classes.margin} />
      {Object.keys(featureTypeAttributeState).map(attribute => {
        //attribute being an attribute of a feature e.g. timestamp, frequency
        const attributeProperties = featureTypeAttributeState[attribute]; //e.g. timestamp:{min,max}, frequency:{min, max}
        const idx = attributeProperties.filterIndex;
        switch (featureTypeState) {
          case MapFeatureTypeState.FILTERS_ADDED: {
            //if filters have not been set yet. Attach the slider to a filter based on the attribute's unique id
            dispatch(setFilter(idx, "name", attribute));
            dispatch(
              setFilter(
                idx,
                "type",
                getFeatureAttributeByName(attribute).filterType
              )
            );
            dispatch(
              setFilter(idx, "value", [
                attributeProperties.min,
                attributeProperties.max,
              ])
            );
            dispatch(
              allFiltersSet(
                FeatureType[featureType as keyof typeof FeatureType]
              )
            );
            return <React.Fragment />;
          }
          case MapFeatureTypeState.FILTERS_SET: {
            return (
              <div key={attribute}>
                <Typography id="type" gutterBottom>
                  {attribute}
                </Typography>
                <Slider
                  defaultValue={[
                    attributeProperties.min!,
                    attributeProperties.max!,
                  ]}
                  getAriaValueText={valuetext}
                  aria-labelledby="range-slider"
                  step={1}
                  min={attributeProperties.min!}
                  max={attributeProperties.max!}
                  valueLabelDisplay="auto"
                  disabled={!attributeProperties.max!}
                  onChangeCommitted={(
                    event: any,
                    newValue: number | number[]
                  ) => handleChange(event, newValue, attribute, idx!)}
                  name={attribute}
                />
              </div>
            );
          }
          default: {
            return <React.Fragment />;
          }
        }
      })}
    </div>
  );
};
export const FilterSliders = connect()(FilterSlidersImpl);
