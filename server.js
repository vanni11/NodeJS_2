const express = require('express'); // 설치한 라이브러리 첨부
const app = express(); // 첨부한 라이브러리 객체 생성
const MongoClient = require('mongodb').MongoClient;
// 2021년부터는 express안에 body-parser있어서, 따로 설치안하고 이렇게 가져옴
app.use(express.urlencoded({extended: true}));
// ejs로 쓴 html을 렌더링할 수 있게함
app.set('view engine', 'ejs');

var db;
MongoClient.connect(
'mongodb+srv://taehun:alfm@cluster0.rbzvi.mongodb.net/todoapp?retryWrites=true&w=majority'
, {useUnifiedTopology: true} //warning메세지 표시 안되도록해줌
, function(err, client) {

    if(err) return console.log('@@@' + err);

    db = client.db('todoapp'); //todoapp이라는 database에 연결

    // // DB insert 테스트
    // db.collection('post').insertOne({_id : 100, 이름 : 'John', 나이 : 20}, (err, result) => {
    //     console.log('저장완료');
    // });

    // 서버 열기
    // 파라미터 : 서버띄울 포트번호, 띄운 후 실행할 코드
    // mongoDB설정한 후 여기로 옮김
    app.listen(8080, function(){
        console.log('listening on 8080');
    });

})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/pet', function(req, res){
    res.send('펫용품 쇼핑 페이지입니다.');
});

// =>(arrow)는 ES6 신문법임. 뭘쓸지는 취향차이.
// 함수내부에서 this키워드값이 바뀐다는데 보통상황에선 신경쓸일 없음
app.get('/write', (req, res) => {
    res.sendFile(__dirname + '/write.html');
});

// 어떤사람이 /add 경로로 POST 요청을 하면 무엇을 해주세요
app.post('/newpost', (req, res) => {
    res.send('전송완료');
    // input에 작성한 정보가 서버로 전달되네!
    console.log(req.body.title); // 요청했던 form의 title 인풋 수신
    console.log(req.body); // 요청했던 form 인풋 수신 (object 자료형으로)

    db.collection('post').insertOne({title : req.body.title, date : req.body.date}, (err, result) => {
        console.log('저장완료');
    });
});

// 어떤사람이 /list 경로로 GET 요청을 하면 DB에 저장된 데이터 표시된 HTML 보여주세요
app.get('/list', function(req, res){
    // DB데이터 꺼내옴
    // post라는 collection의 모든데이터 가져옴
    db.collection('post').find().toArray((err, result) => {
        console.log(result);
        // 이거 밖에 혼자있었는데 이 콜백함수 안으로 넣음
        // DB에서 가져온 result값을 posts변수안에 넣어줌
        res.render('list.ejs', {posts: result});
    });
});