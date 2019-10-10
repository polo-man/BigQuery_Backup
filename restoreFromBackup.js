function restore_from_backup() {
  projectId="YOUR_BIGQUERY_PROJECT_ID";
  datasetId="YOUR_BIGQUERY_DATASET_ID";
  tableId="YOUR_BIGQUERY_TABLE_ID";
  source_GCS_uri="gs://BUCKET/PATH_TO_FILE.json";
  
  var job = {
    configuration:{
      load: {
        "sourceUris": [
          source_GCS_uri
        ],
        "destinationTable": {
          "projectId": projectId,
          "datasetId": datasetId,
          "tableId": tableId
        },
        "sourceFormat": "NEWLINE_DELIMITED_JSON",
        "autodetect": true,
      }
    }
  };   
  job = BigQuery.Jobs.insert(job, projectId); 
}