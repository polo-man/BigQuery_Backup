function backup_ElamaTables_daily() {
   BigQuery_project = “YOUR_BIGQUERY_PROJECT_ID”;
   BigQuery_project = “YOUR_BIGQUERY_DATASET_ID”;
   BigQuery_project = “YOUR_BIGQUERY_TABLE_ID”;

   backup_date_table(BigQuery_project, BigQuery_dataset, BigQuery_table);
   backup_one_table(BigQuery_project, BigQuery_dataset, BigQuery_table);

   // Экспорт одиночных обновляемых таблиц
   function backup_one_table(projectId, datasetId, tableId)
   {
      var d = new Date();
      var day = d.getDate();
      var month = d.getMonth() + 1;
      var year = d.getFullYear();
      var copyDate = "_" + String(year) + String(month<10 ? "0"+month : month) + String(day<10 ? "0"+day : day);
      var job = {
         configuration:{
           extract: {
             "sourceTable": {
               "projectId": projectId,
               "datasetId": datasetId,
               "tableId": tableId
             },
             "destinationUri": "gs://YOUR_STORAGE_BUCKET_NAME/backup/" + projectId + "/" + datasetId + "/" + tableId + "/" + tableId + copyDate + ".json",
             "destinationFormat": "NEWLINE_DELIMITED_JSON"
           }
         }
      }; 
      job = BigQuery.Jobs.insert(job, projectId); 
   }
  
   // Экспорт последней датированной таблицы
   function backup_date_table(projectId, datasetId, tableId)
   {
      var d = new Date();
      year = d.getFullYear(); //текущий год
      month = d.getMonth()+1; //текущий месяц
      day = d.getDate();
      reviewPeriod=7; // Период ретроспективы в днях
      i=0;
      
      do {
        date= "_" + String(year) + String(month<10 ? "0"+month : month) + String(day<10 ? "0"+day : day);
        var job = {
          configuration:{
            extract: {
              "sourceTable": {
                "projectId": projectId,
                "datasetId": datasetId,
                "tableId": tableId + date
            },
            "destinationUri": "gs://YOUR_STORAGE_BUCKET_NAME/backup/" + projectId + "/" + datasetId + "/" + tableId + "/" + tableId + date + ".json",
            "destinationFormat": "NEWLINE_DELIMITED_JSON"
            }
          }
        };
        job=BigQuery.Jobs.insert(job, projectId);
        i++; 
        date=minusDate(year,month,day);
        day=date.day;
        month=date.month;
        year=date.year;
        
        var result = JSON.parse(job);
        if (typeof result.status.errorResult=='undefined') break;
        error=result.status.errorResult.reason;
      // Экспортируем только последнюю созданную в BigQuery таблицу, за последние reviewPeriod дней
      } while(error=='notFound' && i<reviewPeriod);
      // Если же хотим экспортировать все таблицы, созданные за ретроспективный период, следует убрать из цикла условие error=='notFound'
   }
   
   // Функция декремента даты
   function minusDate(y,m,d) 
   {
      d--;
      if(d==0)
      {
         m--;
         if (m==1 || m==3 || m==5 || m==7 || m==8 || m==10) d=31;
         if (m==4 || m==6 || m==9 || m==11) d=30;
         if (m==2) d = (y==2016 || y==2020 ? 29 : 28);
         if (m==0) {m=12; d=31; y--;}
      }
      return { "day": d, "month": m, "year":y}
   } 
}
