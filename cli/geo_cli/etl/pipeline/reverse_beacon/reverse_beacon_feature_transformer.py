import csv
import os
from datetime import datetime, timezone
from io import TextIOWrapper
from typing import Generator, Dict
from zipfile import ZipFile
import json

from geo_cli.etl._feature_transformer import _FeatureTransformer
from geo_cli.etl.pipeline.tiger_line.states import STATE_NAMES_BY_ABBREVIATION

from geo_cli.etl.pipeline.uls.uls_record_transformer import UlsRecordTransformer
from geo_cli.etl.pipeline.uls.uls_records_json_file_loader import UlsRecordsJsonFileLoader
from geo_cli.geocoder import Geocoder
from geo_cli.model.feature import Feature
from geo_cli.model.geometry import Geometry
from geo_cli.model.uls_record_format import UlsRecordFormat
from geo_cli.namespace import TWXPLORE_GEO_APP_GEOMETRY, TWXPLORE_GEO_APP_FEATURE, TWXPLORE_GEO_APP_ONTOLOGY
from geo_cli.path import DATA_DIR_PATH


class ReverseBeaconFeatureTransformer(_FeatureTransformer):
    def transform(self) -> Generator[Feature, None, None]:
        geocoder = Geocoder()

        uls_entities_json_file_path = UlsRecordsJsonFileLoader.loaded_file_path("l_amat_entities")
        if not os.path.isfile(uls_entities_json_file_path):
            self._logger.info("transforming ULS entities")
            with UlsRecordsJsonFileLoader("l_amat_entities") as loader:
                for transformer in (
                    UlsRecordTransformer(record_format=UlsRecordFormat.EN, zip_file_base_name="l_amat"),
                ):
                    loader.load(transformer.transform())
            self._logger.info("transformed ULS entities and wrote to disk")
        self._logger.info("loading ULS entities from %s", uls_entities_json_file_path)
        with open(uls_entities_json_file_path) as json_file:
            uls_entities_by_call_sign = json.load(json_file)
        self._logger.info("loaded ULS entities from %s", uls_entities_json_file_path)

        extracted_data_dir_path = DATA_DIR_PATH / "extracted" / "reverse_beacon"
        duplicate_transmission_count = 0
        duplicate_transmitter_count = 0
        geocode_failure_count = 0
        missing_uls_entity_count = 0
        skipped_uls_entity_count = 0
        yielded_transmitter_call_signs = set()
        yielded_feature_count = 0
        # Accumulate rows by call sign to get the one with the highest "db" / signal-to-noise ratio
        for file_name in sorted(os.listdir(extracted_data_dir_path)):
            if not file_name.endswith(".zip"):
                continue
            zip_file_path = extracted_data_dir_path / file_name
            if not os.path.isfile(zip_file_path):
                continue
            file_base_name = os.path.splitext(file_name)[0]
            self._logger.info("transforming file %s", zip_file_path)
            unique_rows = {}
            with ZipFile(zip_file_path) as zip_file:
                with zip_file.open(file_base_name + ".csv") as csv_file:
                    csv_reader = csv.DictReader(TextIOWrapper(csv_file, "utf-8"))
                    for row in csv_reader:
                        # if row_i > 0 and row_i % 10000 == 0:
                        #     self._logger.info("processed %d rows from %s", row_i, zip_file_path)
                        # DX is the spotted station
                        # DE is the spotting station
                        if row["dx_cont"] != "NA":
                            # Exclude everything outside North America
                            continue
                        try:
                            uls_entity = uls_entities_by_call_sign[row["dx"]]
                        except KeyError:
                            missing_uls_entity_count += 1
                            continue
                        if uls_entity.get("State") != "NY":
                            skipped_uls_entity_count += 1
                            continue
                        # Observed attributes that don't change between spotters, unlike speed and snr/db
                        row_signature = "%(dx)s-%(freq)s-%(band)s-%(mode)s-%(tx_mode)s" % row
                        # Store the timestamp for time deltas
                        row["timestamp"] = datetime.strptime(row["date"], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc) # 2020-02-01 00:00:00
                        unique_rows_for_signature = unique_rows.setdefault(row_signature, [])
                        row_is_unique = True
                        for unique_row in unique_rows_for_signature:
                            delta = abs(unique_row["timestamp"] - row["timestamp"])
                            if delta.seconds < 120:
                                # Rows are probably referring to the same transmission, received at different times by different spotters.
                                row_is_unique = False
                                break
                        if not row_is_unique:
                            duplicate_transmission_count += 1
                            continue
                        unique_rows_for_signature.append(row)

            for row_i, rows in enumerate(unique_rows.values()):
                # Use the row with the highest signal-to-noise ratio
                row = max(rows, key=lambda row: row["db"])

                uls_entity = uls_entities_by_call_sign[row["dx"]]
                try:
                    address = f"{uls_entity['Street Address']}, {uls_entity['City']}, {uls_entity['State']} {uls_entity['Zip Code']}"
                except KeyError:
                    skipped_uls_entity_count += 1
                    continue
                try:
                    wkt = geocoder.geocode(address)
                except LookupError:
                    geocode_failure_count += 1
                    continue
                geometry = \
                    Geometry(
                        uri=TWXPLORE_GEO_APP_GEOMETRY[f"uls-{uls_entity['Unique System Identifier']}"],
                        wkt=wkt
                    )
                state_abbreviation = uls_entity['State'].upper() #STATE_ABBREVIATIONS_BY_LOWER_STATE_NAME[uls_entity.state.lower()]
                state_name = STATE_NAMES_BY_ABBREVIATION[state_abbreviation]

                transmission_feature = \
                    Feature(
                        frequency=float(row["freq"]) * 1000.0,
                        label="Amateur radio transmission: %s (%s)" % (uls_entity['Call Sign'], uls_entity['Entity Name']),
                        locality=uls_entity['City'],
                        geometry=geometry,
                        postal_code=uls_entity['Zip Code'],
                        regions=(state_name,),
                        timestamp=row["timestamp"],
                        transmission_power=int(row["db"]),
                        type=TWXPLORE_GEO_APP_ONTOLOGY.Transmission,
                        uri=TWXPLORE_GEO_APP_FEATURE[f"reverse-beacon-{file_base_name}-{row_i}"]
                    )
                yield transmission_feature
                yielded_feature_count += 1

                if uls_entity['Call Sign'] in yielded_transmitter_call_signs:
                    duplicate_transmitter_count += 1
                    continue

                transmitter_feature = \
                    Feature(
                        label="Amateur radio transmitter: %s (%s)" % (uls_entity['Call Sign'], uls_entity['Entity Name']),
                        locality=uls_entity['City'],
                        geometry=geometry,
                        postal_code=uls_entity['Zip Code'],
                        regions=(state_name,),
                        type=TWXPLORE_GEO_APP_ONTOLOGY.Transmitter,
                        uri=TWXPLORE_GEO_APP_FEATURE[f"uls-entity-{uls_entity['Call Sign']}"]
                    )
                yield transmitter_feature
                yielded_feature_count += 1
                yielded_transmitter_call_signs.add(uls_entity['Call Sign'])

            self._logger.info("transformed file %s", zip_file_path)
            self._logger.info("duplicate transmissions: %d, duplicate transmitters: %d, missing ULS entities: %d, skipped ULS entities: %d, geocode failures: %d, yielded features: %d", duplicate_transmission_count, duplicate_transmitter_count, missing_uls_entity_count, skipped_uls_entity_count, geocode_failure_count, yielded_feature_count)
            # break
