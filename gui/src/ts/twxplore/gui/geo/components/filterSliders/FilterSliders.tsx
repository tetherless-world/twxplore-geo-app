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
  //necessary to pass this into onChangeCommitted since it is no longer called inline :(
  var filterIndexOfAttribute: number | null = null;

  //Get the featureTypeState of the appropriate featureType which was passed in by FilterPanel as a prop
  const featureTypeState = state.featuresByType[featureType].featureTypeState;

  //attributeStatesOfFeatureType is now an object, with each of its properties being the state of
  //an attribute of that FeatureType.
  //i.e. attributeStatesOfFeature = {frequency: {min:0, max:100, filterIndex: 0}, tranmsmissionPower: {min:0, max:20, filterIndex: 1}}
  const attributeStatesOfFeatureType =
    state.featuresByType[featureType].attributeStates;

  const dispatch = useDispatch();

  const handleChange = (
    event: any,
    newValue: number | number[],
    filterIndexOfAttribute: number
  ) => {
    dispatch(setFilter(filterIndexOfAttribute, "value", newValue));
  };
  const onChangeCommitted = (event: any, newValue: number | number[]) => {
    handleChange(event, newValue, filterIndexOfAttribute!);
  };
  return (
    <div className={classes.root}>
      <div className={classes.margin} />
      {//for each attributeName string-key that points to a MapFeatureAttribute state
      Object.keys(attributeStatesOfFeatureType).map(attributeName => {
        const stateOfAttribute = attributeStatesOfFeatureType[attributeName]; //e.g. timestamp:{min,max}, frequency:{min, max}
        filterIndexOfAttribute = stateOfAttribute.filterIndex;
        switch (featureTypeState) {
          //If filters have been added
          case MapFeatureTypeState.FILTERS_ADDED: {
            //if filters have not been set yet. Attach the slider to a filter based on the attribute's unique id
            dispatch(setFilter(filterIndexOfAttribute, "name", attributeName));
            dispatch(
              setFilter(
                filterIndexOfAttribute,
                "type",
                getFeatureAttributeByName(attributeName).filterType
              )
            );
            dispatch(
              setFilter(filterIndexOfAttribute, "value", [
                stateOfAttribute.min,
                stateOfAttribute.max,
              ])
            );
            dispatch(
              allFiltersSet(
                FeatureType[featureType as keyof typeof FeatureType]
              )
            );
            return <React.Fragment />;
          }
          //If filters have been set
          case MapFeatureTypeState.FILTERS_SET: {
            return (
              <div key={attributeName}>
                <Typography id="type" gutterBottom>
                  {attributeName}
                </Typography>
                <Slider
                  defaultValue={[stateOfAttribute.min!, stateOfAttribute.max!]}
                  getAriaValueText={valuetext}
                  aria-labelledby="range-slider"
                  step={1}
                  min={stateOfAttribute.min!}
                  max={stateOfAttribute.max!}
                  valueLabelDisplay="auto"
                  disabled={!stateOfAttribute.max!}
                  onChangeCommitted={onChangeCommitted}
                  name={attributeName}
                />
              </div>
            );
          }
          //This handles the case in which the featureTypeState is ABSENT_ON_MAP or WAITING_ON_LOAD
          default: {
            return <React.Fragment />;
          }
        }
      })}
    </div>
  );
};
export const FilterSliders = connect()(FilterSlidersImpl);
