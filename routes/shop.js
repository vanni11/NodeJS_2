// Express의 방법으로 router생성
// require : 다른 파일이나 라이브러리 가져다 쓰게해줌
var router = require('express').Router();

// 미들웨어(함수) 생성 (server.js에서 가져옴)
function checkLogin(req, res, next){
   if(req.user){ // 로그인 후 세션이 있으면 req.user는 존재함 (세션이 있는지만 확인됨)
       next();
   }else{
       res.send('로그인이 필요합니다!');
   }
}

// 하나하나 쓸필요없이 하단의 모든 route에 이 미들웨어가 적용됨
//router.use(checkLogin);
// 특정 route에 이 미들웨어가 적용됨
//router.use('/shirts', checkLogin);

// 중복되는 부분 생략하면 server.js에서 쓰면 보기좋아짐 -> server.js에서 / 대신 /shop으로 바꿔주면됨
router.get('/shirts', checkLogin/* 라우터에서도 (이렇게 요청과 응답사이에서) 미들웨어 사용가능 -> 이렇게 말고 위처럼 쓰자 */, function(요청, 응답){
   응답.send('셔츠 파는 페이지입니다.');
 });
router.get('/pants', checkLogin/* 라우터에서도 (이렇게 요청과 응답사이에서) 미들웨어 사용가능 -> 이렇게 말고 위처럼 쓰자 */, function(요청, 응답){
   응답.send('바지 파는 페이지입니다.');
});


 // module.exports : 변수명 정해서 내보내줌
 module.exports = router;