// 신뢰할 수 있는 교육 유튜브 채널 목록 (과목별)

const TRUSTED_CHANNELS = {
  // 체육
  체육: [
    "UCqg1CVN3ttR6upe8dHCmyjA", // 열정기백쌤
    "UCrFNcTAsT8uv2otdMUf_rwg", // 양수쌤체육수업
    "UCmpGqI5NZ6W65XS6S2nkaAA", // 송쌤TV (쏭쌤TV)
    "UCH3e9vMlDLUdp8qO5aHbplg", // 이종대왕
    "UCHlt94VtJM3Xe8jC18di0Tg", // 티쳐준호
    "UCUEAfMdSYiXDfRVxdfqAQrg", // 나승빈선생님
    "UCh_ci5gyUZLiilmhAzeF1nA", // 전국놀이자랑
    "UCsnAZiju3R7eyv5KHcjamVQ", // 반올림스쿨
    "UC3S4DVhzCi6_lsF6pmPkMIA", // 흥딩스쿨
    "UC_-JgKkWlKN8HA47OhcX3EQ", // 꾹쌤
    "UCKYFbbJrftS3EQoXBCDS2gw", // 체육튜브
    "UC8cN8lXV3L9IFNf7G83DDTA", // 초등홍선생
    "UCu-bc2QHpnjbv9CCoTqfDaw", // 고썜의수업스케치
    "UCDHA_rZmhpRCKm0uAVyixrg", // 교육놀이애플파이
    "UCmo4pZfVEJVEUJNdU3DyTUA", // 연극하는선생님
    "UCDFsJ8V2tSf09nWry4Hf5pQ", // 조디쌤
  ],

  // 미술
  미술: [
    "UCBg3BzAjCSolApVTYReuVhQ", // 픽미쌤TV
    "UCPyppZROSEKwYej-oXPHdfA", // 소쌤교실
    "UCssTkwx9kDwLE3iJCoRPrKA", // 꿈틀이
    "UCnozL_iCALe9RhlI3qcsOMw", // 싱송쌤송
    "UCG9NBnOFBHU6KWeK04Z16Kg", // 야홍쌤
    "UC2tn4W4ZpGCKaHSwsL29rQg", // 오늘미술초등
    "UCFD07c7MYH4FNnMNpok5ZrQ", // 시골너구리
    "UCKomJvBJZwvzEQzHqiWO8Nw", // 라라쌤
    "UCYjwg3zYNF55sIFHSXK_ZsQ", // 미술랜가이드
    "UCAajm9EiSWC-QTSvS5uDwwg", // 토니배블만만세
    "UCEMnUYnbDID0iaIQafwrT6w", // 조이쌤과행복만들기
    "UCPlrdrhdKWgYa0X6-y5OhHg", // 쌤클라우드
    "UC6HRJAcfIKzfUcWf4LECnkw", // 풀잎쌤
    "UCOqhSYtxGaXQcvOg7My-mmA", // 옥쌤tv
    "UCWBmhqbFBjn_MKKGrK2B_AQ", // 이지미술
    "UCmiLPCHJu5dIkAn7_3KsRUw", // 단지쌤교실
    "UCRyM1oi5ObtCmzbNNfp3lzw", // 재재쌤
    "UCcaalxI59vwNOH-6mhl8LPw", // tv윤슨생
    "UCzrr3YuRy7S4uzE539DBHxw", // 해바라기교실
    "UCJ_1eOCifGWePyzefMCn-AQ", // 요비쌤이랑
    "UCHwOQ9wD0XJLnCEYiHQM1jQ", // 참쌤스쿨
    "UC8cN8lXV3L9IFNf7G83DDTA", // 초등홍선생
    "UCDFsJ8V2tSf09nWry4Hf5pQ", // 조디쌤
    "UC_cRMyAsERs87hqLoyn6uzQ", //까망이고동이쌤
  ],

  // 안전교육
  안전교육: [
    "UCZ5F_Q1jrp0sLAw3DwLjHLw", // 아이쿠tv
    "UC6mmbwPsf3O4ANC9R2kDEeQ", // 경기도소방재난본부
    "UCbylW3LBcOLKL-3A6zIN32w", // 안전한tv
    "UCpHJkdmhK7ZJ1G4su8pSxeA", // 초등백과
    "UC0oWTzsS84bT3XaAhiDEw8w", // 서울소방
    "UCdXB-xqrg37isIQwF0Z5-Dw", //케베스키즈
    "UCLNhdQhyGlmdudmRGRdcYdQ", // 범죄예방365-법무부
    "UCj8Snyrs1y-wnBQiUmGrTjw", // 소방청tv
    "UCCW7N13hV53wZ3ufTFtkmhA", // 대한민국기상청
    "UCx_dzPI6efSohgtOkAG43-A", // EBS키즈
  ],

  // 짜투리영상
  짜투리영상: [
    "UC69Y0mcIX3SbDkVxSoLUUNA", // 안녕자두야
    "UC2qeJDvFWrnbHKHIpTbx6lA", // 핑크퐁
    "UCx_dzPI6efSohgtOkAG43-A", // EBS키즈
    "UCZ5F_Q1jrp0sLAw3DwLjHLw", // 아이쿠tv
    "UCs0P4GrXEumyYn-d8ASrGlA", // 네모아저씨
    "UCPuDvuUhgQffuLn8sYxIEqQ", // 신박과학
    "UCdXB-xqrg37isIQwF0Z5-Dw", //케베스키즈
    "UCP2WffAY2oqvy3zlsHQNatg", // 카툰버스
    "UC7F6UDq3gykPZHWRhrj_BDw", // 사물궁이잡학지식
    "UCaEApyPmXdkz3LXzFWv9FOA", //꼬꼬물퀴즈
    "UCPlwvN0w4qFSP1FllALB92w", // 넘버블록스(한국)
    "UCwOmSshx4nypY7sE3Bbq9pA", //모둠상식
  ],
};

/**
 * 과목에 맞는 신뢰 채널 ID 목록 반환
 */
export function getTrustedChannelIds(subject) {
  return TRUSTED_CHANNELS[subject] || [];
}

export { TRUSTED_CHANNELS };
