var totalPosts = data.old.length + data.new.length;

window.addEventListener('resize', onWindowResize);
document.addEventListener('keydown', onKeyDown);
document.addEventListener('DOMContentLoaded', init);

var ge = id => document.getElementById(id);
var topPanel = ge('topPanel');
var mainImg = ge('mainImage');
var postTitle = ge('postTitle');
var newDalle2Btn = ge('newDalle2Btn');
var oldDalle2Btn = ge('oldDalle2Btn');
var showTitleBtn = ge('showTitleBtn');
var answerBtns = [newDalle2Btn,oldDalle2Btn,showTitleBtn];
var result = ge('result');
var resultText = ge('resultText');
var postLink = ge('postLink');
var newImgBtn = ge('newImgBtn');
var showTitleAlwaysChk = ge('showTitleAlwaysChk');
var backHistoryBtn = ge('backHistoryBtn');
var nextHistoryBtn = ge('nextHistoryBtn');
var help = ge('help');
var scoreElems = {
    total: ge('totalScore'),
    newDalle2: ge('newDalle2Score'),
    oldDalle2: ge('oldDalle2Score')
};
var swipeHelpLeft = ge('swipeHelpLeft');
var swipeHelpRight = ge('swipeHelpRight');

var postHistory = [];
var isAnswerPending = false;
var currentHistoryIdx = -1;
var showNextImageOnLoad = true;
var postIds = [];
var score = {
    oldDalle2: { total: 0, correct: 0},
    newDalle2: { total: 0, correct: 0},
};

const GENERIC_TITLE = 'new DALL-E 2 or old DALLE-E 2?';
var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


function init() {
    ['score', 'btns', 'topPanel', 'imgContainer'].forEach(
        id => document.getElementById(id).style.opacity = 1
    );
    topPanel.addEventListener('touchstart', simulateHoverOnTitle, false);
    loadNextImage();
}

function setAnswer(answer) {
    setSwipeHelpVisibility(false);
    var postData = getCurrentPostData();
    if (!postData || postData.answer !== undefined) {
        return;
    }

    var post = postData.post;
    if (post == undefined) {
        return alert('No post loaded');
    }

    setIsAnswerPending(false);

    var isNewDalle2 = post.isNew;
    var scoreObj = isNewDalle2 ? score.newDalle2 : score.oldDalle2;
    scoreObj.total++;
    if (answer == isNewDalle2) {
        scoreObj.correct++;
    }
    postData.answer = answer;
    showResult(post, isNewDalle2, answer);
    setTimeout(showTitle, 500);
}

function navigateHistory(step) {
    loadHistoryPost(currentHistoryIdx + step);
}

function loadHistoryPost(nextIdx) {
    var isValidIdx = nextIdx >= 0
        && nextIdx < postHistory.length;

    if (!isValidIdx) {
        return;
    }

    if (!postHistory[nextIdx]) {
        showTitle();
        return;
    }

    mainImg.src = '';
    closeResult();
    currentHistoryIdx = nextIdx;
    var postData = getCurrentPostData();
    var isAnswerPending = postData.answer === undefined;
    setIsAnswerPending(isAnswerPending);
    updateHistoryBtns();
    showTitle();

    mainImg.src = postData.post.img_url;

    document.body.className = '';
}

function showTitle(force) {
    var postData = getCurrentPostData();
    if (!postData) {
        postTitle.innerHTML = GENERIC_TITLE;
        return;
    }

    var post = postData.post;
    if (postData.answer !== undefined) {
        var isNewDalle2 = post.isNew;
        var isCorrectAnswer = (postData.answer == isNewDalle2);
        postTitle.innerHTML =
            `[${isNewDalle2 ? 'NEW' : 'OLD'}] `
            + (isCorrectAnswer ? '✅' : '❌')
            + ` <a href="${post.url}" target="_blank">${post.title}</a>`;

    } else {
        postTitle.innerHTML = (force || showTitleAlwaysChk.checked)
            ? `${postData.post.title} by ${postData.post.author}`
            : GENERIC_TITLE;
    }
}

function simulateHoverOnTitle() {
    topPanel.className = 'force-visible';
    setTimeout(() => topPanel.className = '', 3000);
}

function loadNextImage() {
    isNewDalle2 = Math.random() > 0.5;
    postHistory.push(undefined);
    var posts = (isNewDalle2 ? data.new : data.old);
    if (posts.length == 0) {
        isNewDalle2 = !isNewDalle2;
        posts = (isNewDalle2 ? data.new : data.old);
        if (posts.length == 0) {
            alert('Congratulations!, you\'ve answered all ' + totalPosts + ' posts.\r\nSorry, we don\'t have more images.');
            return;
        }
    }
    var postIdx = Math.floor(Math.random() * posts.length);
    var post = posts[postIdx];
    posts.splice(postIdx,1);
    post.isNew = isNewDalle2;
    setNextPost(post);
}

function setNextPost(post, metadataKey) {
    postHistory[postHistory.length - 1] = {
        post: post,
        metadataKey: metadataKey,
        answer: undefined
    };
    document.body.className = '';
    if (showNextImageOnLoad) {
        showNextImageOnLoad = false;
        showNextImage();
    }
}

function showNextImage() {
    for (var i = currentHistoryIdx + 1; i < postHistory.length; i++) {
        if (postHistory[i] && postHistory[i].answer === undefined) {
            loadHistoryPost(i);

            var isLastLoadedPost = i == postHistory.length - 1;
            if (isLastLoadedPost) {
                loadNextImage();
            }

            return;
        }
    }
}

function updateHistoryBtns() {
    backHistoryBtn.className =
        (currentHistoryIdx > 0) ? '' : 'disabled';

    nextHistoryBtn.className =
        currentHistoryIdx < postHistory.length - 2 ? '' : 'disabled';
}

function closeResult() {
    result.className = '';
}

function openHelp() {
    help.style.display = 'block';
}

function closeHelp() {
    help.style.display = 'none';
}

function showResult(post, isNewDalle2, answer) {
    var isCorrect = (isNewDalle2 == answer);
    var correctWrong = isCorrect ? 'CORRECT' : 'WRONG';
    var yesNo = isCorrect ? 'Yes' : 'No';
    var newOld = (isNewDalle2 ? 'NEW' : 'OLD');
    var postDate = formatDate(new Date(post.date));

    resultText.innerHTML = `<h1>${correctWrong}</h1><br />`+
        `${yesNo}, the image was made by the "${newOld}" DALL-E 2 on ${postDate}</a>:`;

    postLink.href = post.url;
    postLink.innerHTML = post.title;

    result.className = (isCorrect ? 'correct' : 'wrong');
    newImgBtn.focus();

    renderScore();
}

function renderScore() {
    scoreElems.total.innerHTML = `${score.newDalle2.correct + score.oldDalle2.correct}`
        + `/${score.newDalle2.total + score.oldDalle2.total}`;

    scoreElems.newDalle2.innerHTML = `${score.newDalle2.correct}`
        + `/${score.newDalle2.total}`;

    scoreElems.oldDalle2.innerHTML = `${score.oldDalle2.correct}`
        + `/${score.oldDalle2.total}`;
}

function getRandomMetadataKey(post) {
    var mdKeys = Object.keys(post.media_metadata)
        .sort((a, b) => 0.5 - Math.random());

    for (var k in mdKeys) {
        var metadataKey = mdKeys[k];
        var imgInfo = post.media_metadata[metadataKey].s;
        var maxAspectRatioDeviation = 0.03;
        var aspectRatio = imgInfo.x / imgInfo.y;
        if (Math.abs(1 - aspectRatio) < maxAspectRatioDeviation) {
            return metadataKey;
        }
    }
}

function getCurrentPostData() {
    return postHistory[currentHistoryIdx];;
}

function setIsAnswerPending(value) {
    isAnswerPending = value;
    var btnCssClass = value ? 'answerPending' : '';
    answerBtns.forEach(btn => btn.className = btnCssClass);
    mainImg.className = value ? 'answerPending' : '';
}

function onKeyDown(event) {
    switch(event.key.toUpperCase()) {
        case 'N': setAnswer(true);      break;
        case 'O': setAnswer(false);     break;
        case 'S':
        case 'W': showNextImage();      break;
        case 'T': showTitle(true);      break;
        case 'B': navigateHistory(-1);  break;
        case 'F': navigateHistory(1);   break;
        case 'ARROWLEFT':
        case 'ARROWUP': moveFocus(-1);  break;
        case 'ARROWRIGHT':
        case 'ARROWDOWN': moveFocus(1); break;
        case '?':
        case 'H': openHelp();           break;
        case 'ESCAPE':
            closeHelp();
            closeResult();
            break;
        break;
    }
}

function moveFocus(step) {
    var actElem = document.activeElement;
    if (actElem == showTitleAlwaysChk) {
        actElem = actElem.parentElement;
    }

    if (actElem.tagName != 'BUTTON'
        && actElem.tagName != 'LABEL') {
        if (newDalle2Btn.className.indexOf('answerPending') >= 0) {
            newDalle2Btn.focus();
        } else {
            newImgBtn.focus();
        }
        return;
    }

    var elem = step > 0
        ? actElem.nextElementSibling
        : actElem.previousElementSibling;
    while (elem) {
        if (elem.tagName == 'BUTTON' || elem.tagName == 'LABEL') {
            elem.focus();
            return;
        }

        elem = step > 0
            ? elem.nextElementSibling
            : elem.previousElementSibling;
    }

    elem = actElem;
    var lastNonNullElem = elem;
    while (elem) {
        elem = step > 0
            ? elem.previousElementSibling
            : elem.nextElementSibling;

        if (elem) {
            lastNonNullElem = elem;
        }
    }
    lastNonNullElem.focus();
}

function showSwipeHelp() {
    setSwipeHelpVisibility(true);
    setTimeout(() => setSwipeHelpVisibility(false), 5000);
}

function setSwipeHelpVisibility(visible) {
    swipeHelpLeft.className = visible ? 'visible' : '';
    swipeHelpRight.className = visible ? 'visible' : '';
}

function onWindowResize() {;
    var postData = getCurrentPostData();
    if (!postData || !postData.metadataKey) {
        return;
    }

    var post = postData.post;
    var metadataKey = postData.metadataKey;
    var imgs = post.media_metadata[metadataKey].p;
    var validImgs = imgs
        .filter(imgOpt => Math.min(imgOpt.x, imgOpt.y) > mainImg.width);

    var imgUrl = getImageUrlBySize(post, metadataKey);

    mainImg.src = imgUrl;
}

function htmlDecode(input) {
    // https://css-tricks.com/snippets/javascript/unescape-html-in-js/
    var e = document.createElement('div');
    e.innerHTML = input;
    return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
}

/* https://gist.github.com/SleepWalker/da5636b1abcbaff48c4d */
var isFirstTouch = true;
var touchstartX = 0;
var touchstartY = 0;
var touchendX = 0;
var touchendY = 0;
const MIN_DIST_TO_SWIPE = 50;
const MIN_XY_RATIO_TO_SWIPE = 0.9;

var gesuredZone = document.body;

gesuredZone.addEventListener('touchstart', function(event) {
    if (isFirstTouch)
        showSwipeHelp();

    touchstartX = event.changedTouches[0].screenX;
    touchstartY = event.changedTouches[0].screenY;
    isFirstTouch = false;
}, false);

gesuredZone.addEventListener('touchend', function(event) {
    touchendX = event.changedTouches[0].screenX;
    touchendY = event.changedTouches[0].screenY;
    handleGesure();
}, false);

function handleGesure() {
    var swipedDistX = touchstartX - touchendX;
    var absSwipedDistX = Math.abs(swipedDistX);
    if (absSwipedDistX < MIN_DIST_TO_SWIPE)
        return;

    var absSwipedDistY = Math.abs(touchstartY - touchendY);
    if (absSwipedDistY == 0 || absSwipedDistX/absSwipedDistY < MIN_XY_RATIO_TO_SWIPE)
        return;

    var swipedRight = (swipedDistX < 0);
    if (isAnswerPending) {
        setAnswer(swipedRight);
        return;
    }

    navigateHistory(swipedRight ? -1 : 1);
}

function formatDate(dateValue) {
    // https://stackoverflow.com/a/15397495
    const nth = function(d) {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
      }
    }

    const date = dateValue.getDate();
    const month = MONTHS[dateValue.getMonth()];

    return `${date}<sup>${nth(date)}</sup> of ${month} ${dateValue.getFullYear()}`;
}
