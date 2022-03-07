const express = require('express'); // 설치한 라이브러리 첨부
const app = express(); // 첨부한 라이브러리 객체 생성
const MongoClient = require('mongodb').MongoClient;
// 2021년부터는 express안에 body-parser있어서, 따로 설치안하고 이렇게 가져옴
app.use(express.urlencoded({extended: true}));
// ejs로 쓴 html을 렌더링할 수 있게함
app.set('view engine', 'ejs');

// static 파일 보관하기 위해 public 폴더쓴다고 명시 (미들웨어 역할)
app.use('/public', express.static('public'));

// PUT, DELETE 쓸수있게하는 라이브러리
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// env파일 사용하기위한 dotenv 라이브러리
require('dotenv').config();

/* ------------------------------------------------------------DB 연결------------------------------------------------------------*/
var db;
MongoClient.connect(
process.env.DB_URL
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
    app.listen(process.env.PORT, function(){
        console.log('listening on 8080');
    });
})

/* ------------------------------------------------------------ 메인 화면 ------------------------------------------------------------*/
app.get('/', function(req, res){
    // html이였을때 이렇게 하지만 ejs로 바꿈
    //res.sendFile(__dirname + '/index.html');
    res.render('index.ejs');
});

app.get('/pet', function(req, res){
    res.send('펫용품 쇼핑 페이지입니다.');
});

/* ------------------------------------------------------------ 게시물 작성 : C ------------------------------------------------------------*/
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
            // 게시물 번호 1씩 증가 -> $inc : 증가, set : 업데이트 (없으면 추가)
            // 다수 수정은 updateMany사용
            // updateOne(수정할 게시물, 수정값, 콜백함수(optional))
            db.collection('counter').updateOne ({name:'게시물개수'},{$inc:{totalPost:1} /* $set:{totalPost:counter+1} */}, (err, result) => {
                if(err) return console.log(err);
            });
            console.log('저장완료');
            res.send('전송완료');
        });
    });
});

/* ------------------------------------------------------------ 게시물 읽기 : R ------------------------------------------------------------*/
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

// 게시물 검색 - 쿼리스트링 방식
app.get('/search', (req, res) => {
    // 원래는 req.body로 폼속성을 가져왔는데, 쿼리스트링은 req.query
    // 강의에선 정규식을 - 자바스크립트 표현인 /abc/ 로 사용하면 문자열만 안에 넣을 수 있어서 못쓴다고했는데
    // 1. 아래같은 몽고DB 문법이 있으니 이걸쓰면됨 -> 이게 제일 나은듯...
    //db.collection('post').find({title: {'$regex' : req.query.value}}).toArray((err, result) => {

    // 2. 미리 만들어둔 text index를 이용하여 검색엔진스럽게 검색가능 (빠른검색, 연산자로 검색기능)
    //db.collection('post').find( {$text: { $search: req.query.value }} ).toArray((err, result) => {

    // 3. MongoDB의 searchIndex 사용
    // aggregate 사용 (searchIndex 쓰려면 사용해야됨) -> 다양한 기능이 있으므로 노션참고
    var 검색조건 = [
        {
          $search: {
            index: 'titleSearch',
            text: {
              query: req.query.value,
              path: 'title'  // 제목,날짜 둘다 찾고 싶으면 ['title', 'date']
            }
          }
        }
        //, {$sort: {_id: 1}} //id기준 오름차순
        //, {$limit: 5} //상위 다섯개만 가져옴
        , {$project: {title: 1, _id: 0, score: {$meta: "searchScore"}}} //검색결과에서 원하는값만 가져옴 (저장한 데이터가 아닌 score라는 값도 가져올수있음) -> SELECT와 유사
    ]
    db.collection('post').aggregate(검색조건).toArray((err, result) => {

        console.log(result);
        // 강의에선 검색결과 보여주는 search.ejs 새로 만듬 / 그냥 아래처럼 list.ejs 그대로 써도 될듯?
        res.render('list.ejs', {posts: result});
    });

});

/* ------------------------------------------------------------ 게시물 삭제 : D ------------------------------------------------------------*/
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

/* ------------------------------------------------------------ 게시물 수정 : U ------------------------------------------------------------*/
// edit/xx 요청오면 xx(URL의 파라미터)에 따라 URL생성
app.get('/edit/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id) /*:id를 가져옴*/}, function(err, result){
        if(result == null) {
            res.send('존재하지 않는 게시물 번호입니다!!!');
        } else {
            console.log(result);
            res.render('edit.ejs', {data : result});
        }
    });
});

app.put('/editpost', function(req, res){
    db.collection('post').updateOne({_id: parseInt(req.body.id)}, {$set : {title: req.body.title, date: req.body.date}}, function(err, result){
        if(err) console.log(err);
        res.redirect('/list');
    });
});


/* ------------------------------------------------------------ 회원인증 기능 시작 ------------------------------------------------------------*/
// 회원가입기능은 너무 복잡하므로 만들지않고 DB에 회원정보 직접생성함
// 비밀번호 암호화도 여기서는 하지않음

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const res = require('express/lib/response');

// 라이브러리 사용법이니 이해하는거 아니고 그냥 사용하기
app.use(session({secret: '비밀코드', resave: true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(req, res){
    res.render('login.ejs');
});

// passport.authenticate : 아이디,비번 검사하는 passport 문법
// local : local 방식으로 로그인 요청
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail' // 회원인증 실패시 /fail로 이동
}) , function(req, res){
    res.redirect('/mypage'); //회원인증 성공시 /로 이동
});

// [passport 세부설정]
// Strategy : 인증하는 방법
// 우리는 LocalStrategy를 사용할거고 아래에서 정의하고 있음 -> 깊게 이해는 안해도됨
// 비번을 직접비교하는건 보안에 안좋으므로 나중에 암호화 추가해서 보완하기
passport.use(new LocalStrategy({
    // 설정 파라미터 4개
    usernameField: 'id', // 사용자가 제출한 아이디가 어디 적혀있는지
    passwordField: 'pw', // 사용자가 제출한 비밀번호가 어디 적혀있는지
    session: true, // 세션으로 저장할것인지
    passReqToCallback: false, // id,pw 외에 다른 정보 검증시 true로 설정하고 아래 function에 파라미터 추가 -> 알필요없음
  }, function (inputID, inputPW, done) {
    //console.log(inputID, inputPW);

    // done(서버에러[DB연결 불가 등], 성공시 보내는 사용자 DB데이터, 에러메세지)
    db.collection('login').findOne({ id: inputID }, function (err, result) {
      if (err) return done(err);
  
      if (!result) return done(null, false, { message: '존재하지않는 아이디!' });
      if (inputPW == result.pw) {
        return done(null, result); // result가 serializeUser의 user로 전달됨!!
      } else {
        return done(null, false, { message: '비번 틀림' });
      }
    })
  }));

// 위에까지로 로그인 기능은 완성인데, 로그인 유지시키려면 아래처럼 세션만들기
// id를 이용한 암호문을 세션으로 저장시키는 코드 (로그인 성공시 실행)
passport.serializeUser(function(user, done){
done(null, user.id); // 이후에는 세션의 id정보를 쿠키로 보내짐
});

// 해당 세션 데이터를 가지고있는게 DB에 있는지 검증 (마이페이지 접속시 실행)
passport.deserializeUser(function(id, done){
    // 가지고있는 세션으로 유저를 찾아서 유저정보를 넣어줌
    db.collection('login').findOne({id: id/*user.id*/}, function(err, result){
        done(null, result); // result가 req.user로 들어가짐(?)
    });
});

/* ------------------------------------------------------------ 마이페이지 ------------------------------------------------------------*/
//#region
app.get('/mypage', checkLogin/* 두번째 인자에 넣는 방법으로 미들웨어를 쓴다 */, function(req, res){
    console.log(req.user);
    res.render('mypage.ejs', {user: req.user});
});

// 미들웨어(함수) 생성
function checkLogin(req, res, next){
    if(req.user){ // 로그인 후 세션이 있으면 req.user는 존재함 (세션이 있는지만 확인됨)
        next();
    }else{
        res.send('로그인이 필요합니다!');
    }
}
//#endregion