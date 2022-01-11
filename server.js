const express = require('express'); // 설치한 라이브러리 첨부
const app = express(); // 첨부한 라이브러리 객체 생성

//2021년부터는 express안에 body-parser있어서, 따로 설치안하고 이렇게 가져옴
app.use(express.urlencoded({extended: true}));

// 서버 열기
// 파라미터 : 서버띄울 포트번호, 띄운 후 실행할 코드
app.listen(8080, function(){
    console.log('listening on 8080');
});

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
});