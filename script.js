const docs = document.querySelector(".docs");
const searchInput = document.querySelector("#searchInput");

// --------------------------------------

let oxData = new Set();
let ollaData = new Set();
let kkongData = new Set();
let garoData = new Set();

const fetchData = (selectedOption) => {
  const src =
    selectedOption === "1"
      ? "./data/ox_utf8.txt"
      : selectedOption === "2"
      ? "./data/olla_utf8.txt"
      : selectedOption === "3"
      ? "./data/kkong_utf8.txt"
      : "./data/garo_utf8.txt";

  if (src.includes("ox") && oxData.length > 0) return;
  if (src.includes("olla") && ollaData.length > 0) return;
  if (src.includes("kkong") && kkongData.length > 0) return;
  if (src.includes("garo") && garoData.length > 0) return;

  fetch(src)
    .then((response) => response.text())
    .then((data) => {
      splitData = data.split("\n");

      if (src.includes("ox") || src.includes("garo")) {
        splitData.forEach((line) => {
          const lastQstringIndex = line.lastIndexOf("(");
          const [question, answer] = [
            line.substring(0, lastQstringIndex + 1).trim(),
            line.substring(lastQstringIndex + 1).trim(),
          ];
          oxData.add({ question, answer });
        });
      }

      if (src.includes("olla")) {
        splitData.forEach((line) => {
          const lastQstringIndex = line.lastIndexOf("?");
          const [question, answer] = [
            line.substring(0, lastQstringIndex + 1).trim(),
            line.substring(lastQstringIndex + 1).trim(),
          ];
          ollaData.add({ question: question, answer });
        });
      }

      if (src.includes("kkong")) {
        splitData.forEach((line) => {
          processLine(line, kkongData);
        });
      }
    });
};

const splitLine = (line, delimiter, includeDelimiter) => {
  const lastIndex = line.lastIndexOf(delimiter);
  let question = line
    .substring(0, lastIndex + (includeDelimiter ? 1 : 0))
    .trim();
  let answer = line.substring(lastIndex + (includeDelimiter ? 1 : 0)).trim();

  if (answer.indexOf(" ", 2) > 0) {
    answer = answer.split(" ")[0];
    if (answer.includes("(")) {
      answer = answer.replace("(", "");
    }
  }

  return [question, answer.trim()];
};

function processLine(line, gameData) {
  let delimiter;
  let includeDelimiter = true;

  if (line.indexOf("?") > 0) {
    delimiter = "?";
  } else if (line.indexOf("(") > 0) {
    delimiter = "(";
    includeDelimiter = false;
  } else if (line.indexOf(".") > 0) {
    delimiter = ".";
  } else {
    delimiter = " ";
  }
  const [question, answer] = splitLine(line, delimiter, includeDelimiter);
  gameData.add({ question, answer });
}

ctg.addEventListener("change", (e) => {
  fetchData(e.target.value);
});

// --------------------------------------

const CHO_HANGUL = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const HANGUL_START_CHARCODE = "가".charCodeAt();
const CHO_PERIOD = Math.floor("까".charCodeAt() - "가".charCodeAt());
const JUNG_PERIOD = Math.floor("개".charCodeAt() - "가".charCodeAt());

function combine(cho, jung, jong) {
  return String.fromCharCode(
    HANGUL_START_CHARCODE + cho * CHO_PERIOD + jung * JUNG_PERIOD + jong
  );
}

// 초성검색
function makeRegexByCho(search = []) {
  const regexArray = search.map((s) => {
    return CHO_HANGUL.reduce(
      (acc, cho, index) =>
        acc.replace(
          new RegExp(cho, "g"),
          `[${combine(index, 0, 0)}-${combine(index + 1, 0, -1)}]`
        ),
      s
    );
  });

  const regex = regexArray.map((r) => `(?=.*${r})`).join("");
  return new RegExp(`(${regex})`, "g");
}

function includeByCho(search, targetWord) {
  return makeRegexByCho(search).test(targetWord);
}

// --------------------------------------

function _events() {
  const search = searchInput.value.trim().split(" ");
  if (search.length < 2 && search[0] === "") return;

  const regex = makeRegexByCho(search);
  const selectedOption =
    document.getElementById("ctg").selectedOptions[0].value;
  const list =
    selectedOption === "1"
      ? oxData
      : selectedOption === "2"
      ? ollaData
      : selectedOption === "3"
      ? kkongData
      : garoData;

  let htmlDummy = "";

  list.forEach((item) => {
    if (regex.test(item.question)) {
      htmlDummy += `
      <span class='item'>
        Q. ${item.question.replace(regex, "<mark>$1</mark>")}
        <span class='answer'>A. ${item.answer}</span>
      </span>`;
    }
  });

  document.querySelector(".docs span").innerHTML = search
    ? htmlDummy
    : "검색 결과가 없습니다.";
}

function debounce(func, wait) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(func, wait);
  };
}

searchInput.addEventListener("input", debounce(_events, 500));

/* 클릭 답 복사 */
docs.addEventListener("click", (e) => {
  let copiedAnswer;
  if (e.target && e.target.nodeName === "SPAN") {
    copiedAnswer = e.target
      .querySelector(".answer")
      .textContent.replace(/[()A.]/g, "")
      .trim();
  }
  navigator.clipboard.writeText(copiedAnswer);
  openToast(copiedAnswer);
});

/* 토스트 */
const toast = document.querySelector(".toast");
function openToast(text) {
  toast.style.display = "block";
  toast.querySelector("span").textContent = text;
  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}
