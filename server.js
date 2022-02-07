const express = require('express'); // 설치한 라이브러리 첨부
const app = express(); // 첨부한 라이브러리 객체 생성
const MongoClient = require('mongodb').MongoClient;
// 2021년부터는 express안에 body-parser있어서, 따로 설치안하고 이렇게 가져옴
app.use(express.urlencoded({extended: true}));
// ejs로 쓴 html을 렌더링할 수 있게함
app.set('view engine', 'ejs');

// static 파일 보관하기 위해 public 폴더쓴다고 명시 (미들웨어 역할)
app.use('/public', express.static('public'));

var db;
MongoClient.connect(
'mongodb+srv://taehun:alfm@cluster0.rbzvi.mongodb.net/todoapp?retryWrites=true&w=majority'
, {useUnifiedTopology: true} //warning메세지 표시 안되도록해줌
, function(err, client) {
    if(err) return console.log('@@@' + err);

    db = client.db('todoapp'); //todoapp이라는 database에 연결

    // // DB insert 테스트
    // db.collection('post').insertOne({_id:100, 이름:'John', 나이:20}, (err, result) => {
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
    // html이였을때 이렇게 하지만 ejs로 바꿈
    //res.sendFile(__dirname + '/index.html');
    res.render('index.ejs');
});

app.get('/pet', function(req, res){
    res.send('펫용품 쇼핑 페이지입니다.');
});

// =>(arrow)는 ES6 신문법임. 뭘쓸지는 취향차이.
// 함수내부에서 this키워드값이 바뀐다는데 보통상황에선 신경쓸일 없음
app.get('/write', (req, res) => {
    // html이였을때 이렇게 하지만 ejs로 바꿈
    //res.sendFile(__dirname + '/write.html');
    res.render('write.ejs');
});

// 어떤사람이 /newpost 경로로 POST 요청을 하면 무엇을 해주세요
app.post('/newpost', (req, res) => {
    // input에 작성한 정보가 서버로 전달되네!
    //console.log(req.body.title); // 요청했던 form의 title 인풋 수신
    //console.log(req.body); // 요청했던 form 인풋 수신 (object 자료형으로)

    // 시퀀스 만들듯이 번호 생성
    db.collection('counter').findOne({name:'게시물개수'}, (err, result) => {
        var counter = result.totalPost; // var는 function안에서만 사용가능

        // 이거 밖에 혼자있었는데 이 콜백함수 안으로 넣음
        db.collection('post').insertOne({_id:counter, title:req.body.title, date:req.body.date}, (err, result) => {
            // 게시물 번호 1씩 증가
            // 다수 수정은 updateMany사용 // 콜백함수는 optional
            db.collection('counter').updateOne ({name:'게시물개수'},{$inc:{totalPost:1} /* $set:{totalPost:counter+1} */}, (err, result) => {
                if(err) return console.log(err);
            });
            console.log('저장완료');
            res.send('전송완료');
        });
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

app.delete('/delete', function(req, res){
    console.log(req.body);

    // req.body는 _id : '1' 로 넘어와서 DB상의 _id : 1 (int) 와 안맞으므로 바꿔줌
    req.body._id = parseInt(req.body._id);
    // req.body의 게시물번호의 글을 DB에서 삭제
    db.collection('post').deleteOne(req.body /* 어떤항목을 삭제할지 (쿼리라고 생각) */, function(err, result){
        console.log('삭제완료');
        res.status(200).send({ message : '성공했습니다!!' }); // 응답코드 200(성공)일때 메세지 보냄 / send의 파라미터가 object형이 아니여도됨
    });
});

// detail/xx 요청오면 xx(URL의 파라미터)에 따라 URL생성
app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id) /*:id를 가져옴*/}, function(err, result){
        if(result == null) {
            res.send('존재하지 않는 게시물 번호입니다!!!');
        } else {
            console.log(result);
            res.render('detail.ejs', {data : result});
        }
    });
});