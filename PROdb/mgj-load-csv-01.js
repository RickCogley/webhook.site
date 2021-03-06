// Call from github 
//result = import('https://raw.githubusercontent.com/RickCogley/webhook.site/master/PROdb/mgj-load-csv-01.js')
//echo(result) 

// Configuration
prodb74559_token = var('g_prodb74559_token');
// prodb74559_hosp_upsert_url = var('g_prodb74559_hosp_upsert_url');
prodb74559_myracct_upsert_url = var('g_prodb74559_myracct_upsert_url');
prodb74559_userprops_upsert_url = var('g_prodb74559_userprops_upsert_url');
prodb74559_myracctuserprops_upsert_url = var('g_prodb74559_myracctuserprops_upsert_url');
prodb74559_newextuser_upsert_url = var('g_prodb74559_newextuser_upsert_url');

matchuser = var('g_basic_auth_user_02');
matchpass = var('g_basic_auth_pw_02');
entereduser = var('request.header.php-auth-user');
enteredpass = var('request.header.php-auth-pw');
url = var('request.url');
echo(url);

// get date for job number keeping Japan TZ

jobdate = 'now'.date_format('YYYY-MM-DD-HHmm', null, 'GMT+9', true)

// setup authenticate function to be DRY
function authenticate() {
    respond('', 401, [
        'WWW-Authenticate: Basic realm="Login to Myriad Utility URL"'
    ]);
}

// authenticate if there is no entered user or pass
if (!entereduser or !enteredpass) {
    authenticate()
}
// authenticate if the entered user or pass fails to match the expected ones kept in variables
if (entereduser != matchuser and enteredpass != matchpass) {
    authenticate()
}

// Get reference loads qty for comparison after load
//echo("GET reference loads qty");
//prodb_response1 = request(
//  prodb55438_reference_loads_url,
//  '',
//  'GET',
//  ['Content-Type: application/json',
//   'Authorization: bearer ' + prodb55438_token
//  ]
//)

// Prep qty data
//presp1 = prodb_response1['content'];
//echo(presp1);
//qtybefore = json_path(presp1, '0."Display Name 2"');
//echo(qtybefore);

// Display file upload form and exit if HTTP method is not POST
// That is, if someone just accesses the utility URL in a standard way, doing a GET
//echo(var(request.method));


if (var('request.method') != 'POST') {
  respond('<html lang="ja">
<head>
  <title>MGJ OESのCSVアップロード</title>
 <link rel="stylesheet" href="https://unpkg.com/spectre.css/dist/spectre.min.css">
</head>
<body class="text-dark p-2">
    <div class="container grid-lg">
          <div class="columns">
              <div class="column col-10">
                <header class="navbar bg-gray p-2 my-2">
                  <section class="navbar-section">
                    <a href="https://db.myriadgenetics-ops.com/secure/db/74559/overview.aspx?t=724298" class="navbar-brand mr-2"><img class="img-responsive" src="https://assets.esolia.com/mgj/myriad-logo.png" alt="Myriad Logo" width="100px"></a>
                  </section>
                  <section class="navbar-section">
                    <a href="https://db.myriadgenetics-ops.com/secure/db/74559/overview.aspx?t=724298" class="btn btn-link">M-SODAS</a>
                  </section>
                </header>
                <h1 class="text-success mt-4">M-SODASのCSVアップロード</h1>
              <p>この webhook.site URLは、新規ユーザーデータの入った、決まった形式のCSVを受け付けて、様々な変換してからM-SODAS PROdbにアップしてくれます。</p>
              <br>
              <!-- form input control -->
              <form onSubmit="document.getElementById(\'submit\').disabled=true;" action="{}" method="POST" enctype="multipart/form-data" class="form-horizontal">
                <div class="form-group">
                  <div class="col-3 col-sm-12">
                    <label class="form-label" for="csv-load">イニシャル選択</label>
                  </div>
                  <div class="col-9 col-sm-12">
                    <select name="initials" id="initials" autocomplete="initials" class="form-select" placeholder="イニシャル">
                      <option>YK</option>
                      <option>KC</option>
                      <option>JRC</option>
                      <option>Myriad</option>
                      <option>eSolia</option>
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <div class="col-3 col-sm-12">
                    <label class="form-label" for="jobdate">ジョブ日時</label>
                  </div>
                  <div class="col-9 col-sm-12">
                    <input class="form-input" type="text" name="jobdate" id="jobdate" placeholder="Job Date" value="{}" />
                  </div>
                </div>
                <div class="form-group">
                  <div class="col-3 col-sm-12">
                    <label class="form-label" for="csv-load">CSV選択</label>
                  </div>
                  <div class="col-9 col-sm-12">
                    <div class="input-group">
                      <input class="form-input input-group-addon" id="inputfile" type="file" name="file" />
                      <button class="btn btn-success input-group-btn c-hand btn-lg" type="submit" id="submit">CSV送信</button>
                    </div>
                  </div>
                </div>

                
              </form>
              
              </div>
          </div>
      </div>
</body>
</html>'.format(url,jobdate));
}
// Like a heredoc, chain the html with curly bracket placeholders to format()
// The order of vars passed to format matters

// See and capture the form request
echo(var('request.form.jobdate'));
echo(var('request.form.initials'));
forminit = var('request.form.initials');
formjd = var('request.form.jobdate');
jobstring = forminit + "-" + formjd;

// Use a comma as delimiter and treat first row (0) as header row
csv_content = var('request.file.file.content')

echo("replace 0 with ZZEERROO in csv");
csv_nozero = string_replace(csv_content,"0","ZZEERROO");

array = csv_to_array(csv_nozero, ',', 0)
dump(array);

// If CSV can't be parsed, or there's less than 2 rows, fail
if (!array or array.length() < 1) {
    respond('
        <h1>Could not parse CSV</h1>
        <a href="{}">Upload Again</a>
    '.format(url));
}


// Make blank array for hospitals
// arrayhosp = [];
// Loop over data and prepare array
// echo("Looping over original array from CSV and pulling hospital fields");
// for (subObject in array) {
//     array_push(arrayhosp, [
//         'SRL 病院コード': string_replace(to_string(subObject['SRL 病院コード']),"ZZEERROO","0"),
//         'SRL 病院名': string_replace(subObject['SRL 病院名'],"ZZEERROO","0"),
//         'SRL 担当メール': string_replace(subObject['SRL 担当メール'],"ZZEERROO","0"),
//         'Source': 'CSV',
//         'Job': jobstring
//     ])
// }

//string_replace(astring,"ZZEERROO","0")

// dump(arrayhosp);
// arrayhosp_json = json_encode(arrayhosp);
// echo(arrayhosp_json);
// upsert to OES
// oes_hospupsert_response = request(
//   prodb74559_hosp_upsert_url,
//   arrayhosp_json,
//   'POST',
//   ['Content-Type: application/json',
//    'Authorization: bearer '+ prodb74559_token
//   ]
// )


// Make blank array for myriad account
arraymyracct = [];
// Loop over data and prepare array
echo("Looping over original array from CSV and pulling myriad account fields");
for (subObject in array) {
    array_push(arraymyracct, [
        'First Name': string_replace(subObject['First Name'],"ZZEERROO","0"),
        'Last Name': string_replace(subObject['Last Name'],"ZZEERROO","0"),
        'Email Address': string_replace(subObject['Email Address'],"ZZEERROO","0"),
        'ミリアド ID': string_replace(to_string(subObject['Myriad Account']),"ZZEERROO","0"),
        'SRL病院コード': string_replace(to_string(subObject['SRL 病院コード']),"ZZEERROO","0"),
        'Source': 'CSV',
        'Job': jobstring
    ])
}
//'ミリアド ID': to_string(string_replace(subObject['Myriad Account'],"ZZEERROO","0")),
//'SRL病院コード': to_string(string_replace(subObject['SRL 病院コード'],"ZZEERROO","0")),
dump(arraymyracct);
arraymyracct_json = json_encode(arraymyracct);
echo(arraymyracct_json);
// upsert to OES
msodas_myracctupsert_response = request(
  prodb74559_myracct_upsert_url,
  arraymyracct_json,
  'POST',
  ['Content-Type: application/json',
   'Authorization: bearer '+ prodb74559_token
  ],
  false,
  30
)

// Make blank array for myriad account
arraynewextuser = [];
// Loop over data and prepare array
echo("Looping over original array from CSV and pulling fields for new external user");
for (subObject in array) {
    array_push(arraynewextuser, [
        'First Name': string_replace(subObject['First Name'],"ZZEERROO","0"),
        'Last Name': string_replace(subObject['Last Name'],"ZZEERROO","0"),
        'Email': string_replace(subObject['Email Address'],"ZZEERROO","0"),
        'Myriad Account': string_replace(to_string(subObject['Myriad Account']),"ZZEERROO","0"),
        'Source': 'CSV',
        'Job': jobstring
    ])
}
dump(arraynewextuser);
arraynewextuser_json = json_encode(arraynewextuser);
echo(arraynewextuser_json);
// upsert to m-sodas
echo("Loop over new user array and upsert each separately");
for (subObject in arraynewextuser) {
    subjson = "["+ json_encode(subObject) + "]";
    echo(subjson);
    msodas_newextuserupsert_response = request(
      prodb74559_newextuser_upsert_url,
      subjson,
      'POST',
      ['Content-Type: application/json',
       'Authorization: bearer '+ prodb74559_token
      ]
    )
} 


// Display the parsed CSV in JSON format 
respond('<html lang="ja">
  <head>
    <title>MGJ M-SODASのCSVアップロード結果</title>
    <link rel="stylesheet" href="https://unpkg.com/spectre.css/dist/spectre.min.css">
 </head>
  <body class="text-dark p-2">
      <div class="container grid-lg">
            <div class="columns">
                <div class="column col-10">
                <header class="navbar bg-gray p-2 my-2">
                  <section class="navbar-section">
                    <a href="https://db.myriadgenetics-ops.com/secure/db/74559/overview.aspx?t=724298" class="navbar-brand mr-2"><img class="img-responsive" src="https://assets.esolia.com/mgj/myriad-logo.png" alt="Myriad Logo" width="100px"></a>
                  </section>
                  <section class="navbar-section">
                    <a href="https://db.myriadgenetics-ops.com/secure/db/74559/overview.aspx?t=724298" class="btn btn-link">M-SODAS</a>
                  </section>
                </header>
                 <h1 class="text-success mt-4">M-SODASのCSVアップロード結果</h1>
                 <p>ジョブ「{}」のアップロードしたデータは下記の通り。</p>
                 <br>
                    <p><button class="btn btn-success c-hand"><a href="{}" class="text-light">次のCSVアップロード</a></button></p>
                    <div class="divider text-center" data-content="RESULTS"></div>
                    <h2 class="text-gray">JSON形式のアップロードデータ</h2>
                    <h3 class="text-dark">ミリアドアカウント</h3>
                    <pre class="code" data-lang="JSON"><code>{}</code></pre>
                    <h3 class="text-dark">新規外部ユーザー</h3>
                    <pre class="code" data-lang="JSON"><code>{}</code></pre>
                </div>
            </div>
        </div>
  </body>
</html>
'.format(jobstring,url,arraymyracct_json,arraynewextuser_json));
// Like a heredoc, chain the html with curly bracket placeholders to format()
// The order of vars passed to format matters



