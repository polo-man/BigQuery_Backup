function backup_DeleteExpired_daily() 
{
   // Private key and client email of the service account.
   var PRIVATE_KEY =
       '-----BEGIN PRIVATE <your private key> -----END PRIVATE KEY-----\n'
   var CLIENT_EMAIL = 'backup-storage@BQproject.iam.gserviceaccount.com'
   // Email address of the user to impersonate.
   var USER_EMAIL = 'user@yourdomain.ru'
   
   backup_lifetime=2; // сколько месяцев будет жить файл
   BigQuery_project = “YOUR_BIGQUERY_PROJECT_ID”;
   BigQuery_project = “YOUR_BIGQUERY_DATASET_ID”;
   BigQuery_project = “YOUR_BIGQUERY_TABLE_ID”;
   bucket = “YOUR_BUCKET_IN_GCS”;

   reset();
   run(BigQuery_project, BigQuery_dataset, BigQuery_table);

   // Функция удаления устаревшего файла
   function run(projectId, datasetId, tableId) 
   {
      // формируем URL
      prefix='backup%2f'+projectId+'%2f'+datasetId+'%2f'+tableId+'%2f'
      prefixSlash=prefix.replace('%2f','/', 'g');
      var url= 'https://www.googleapis.com/storage/v1/b/'+bucket+'/o?prefix='+prefix+'&fields=items(name)' 
      
      // Дата истечения срока жизни файла
      var date = new Date();
      date.setMonth( date.getMonth() - backup_lifetime ); 
      year = date.getFullYear();
      month = date.getMonth()+1;
      day = date.getDate();
      var expiredDate = String(year) + String(month<10 ? "0"+month : month) + String(day<10 ? "0"+day : day);
      
      // Берем список файлов в GCS
      response=APIquery('get', url);
      response= JSON.parse(response);
      
      response.items.forEach(function(element) 
      {
         fileDateExt=element["name"].match('('+prefixSlash+tableId+'_)(.*)')[2]; // дата создания файла вида 20190530.json
         fileDate=fileDateExt.substr(0,8); // отсекаем расширение .json
         if (fileDate<=expiredDate)
         {
            url='https://storage.googleapis.com/'+bucket+'/'+prefixSlash+tableId+'_'+fileDateExt;
            APIquery('delete', url); // Отправляем запрос на удаление в API GCS
         }
      });

   }
   
   // Функция обращения к API GCS
   function APIquery(method, url)
   {
      var service = getService();
      if (service.hasAccess()) {
         var options= {
            method: method,
            headers: {
               Authorization: 'Bearer ' + service.getAccessToken()
            }
         }
         var response = UrlFetchApp.fetch(url, options);          
      } else {
         Logger.log('Access denied.');
         response=false;
      }      
      return response;
   }

   function reset() {
     getService().reset();
   }

   // Функция OAuth2 авторизации
   function getService() {
     return OAuth2.createService('Storage:' + USER_EMAIL)
         .setTokenUrl('https://oauth2.googleapis.com/token')
         .setPrivateKey(PRIVATE_KEY)
         .setIssuer(CLIENT_EMAIL)
         // Set the name of the user to impersonate. This will only work for
         // Google Apps for Work/EDU accounts whose admin has setup domain-wide
         // delegation:
         // https://developers.google.com/identity/protocols/OAuth2ServiceAccount#delegatingauthority
         .setSubject(USER_EMAIL)
         .setPropertyStore(PropertiesService.getScriptProperties())
         // Set the scope. This must match one of the scopes configured during the
         // setup of domain-wide delegation.
         .setScope("https://www.googleapis.com/auth/devstorage.read_write");
   }  
}