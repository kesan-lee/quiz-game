const databaseLink = 'https://opentdb.com/api.php?';
const categoryListLink = 'https://opentdb.com/api_category.php';
const app = document.getElementById('app');
const game = document.getElementById('game');
const startMenu = document.getElementById('start-menu');
const dropdownCategories = document.getElementById('category-select');
const numberOfQuestionsInput = document.getElementById('questions-number-input');
const playerNameInput = document.getElementById('player-name');
const numberOfQuestions = document.getElementById('questions-number-input');
const difficultyToSelect = document.getElementById('difficulty-to-select');
const scoreSection = document.getElementById('score-section');
const scoreBoard = document.getElementById('score-board');
const currentPlayerScoreBoardSection = document.getElementById('current-player-score-section');
const startBtn = document.getElementById('start-button');
const deleteScoreBtn = document.getElementById('delete-scores-btn');
let scores = JSON.parse(localStorage.getItem('scores')) || [];
let questions;
let difficulty;
let playerName;
let currentScore;
let playerObject;
let correctAnswer;
let answerButtons;
let questionDataIndexIncrement = 0;
let answerChosen = false;
let emptyClicks = 0;
const categoriesArr = [];
const tokenObj = {
    token: '',
    date: ''
}




function selectAnswer() {
    if (answerChosen === false) {
        if (!this.classList.contains('wrong-answer') || !this.classList.contains('correct-answer')) {
            this.classList.add('btn-active');
        }
        const addClasses = () => {
            if (this.innerText === correctAnswer) {
                this.classList.remove('btn-active');
                this.classList.add('correct-answer');
                if (difficulty === '(easy)') {
                    playerObject.score += 10;
                    currentScore += 10;
                } else if (difficulty === '(medium)') {
                    playerObject.score += 20;
                    currentScore += 20;
                } else if (difficulty === '(hard)') {
                    playerObject.score += 50;
                    currentScore += 50;
                }
            } else {
                this.classList.remove('btn-active');
                this.classList.add('wrong-answer');
                const newArr = Array.from(answerButtons);
                correctButton = newArr.find((el) => el.innerHTML === correctAnswer || el.innerText === correctAnswer);
                console.log(correctAnswer);
                console.log(newArr);
                console.log(correctButton);
                correctButton.classList.add('correct-answer');
            }
            
        createCurrentScoreBoard();
        updateScore()
        }
        addClasses();
        if (questionDataIndexIncrement === questions.results.length) {
            game.innerHTML += `<div id="final-buttons-div"><button id="play-again" class="final-buttons">Play again</button><button id="back-to-start" class="final-buttons">Back to Start</button></div>`;
            document.getElementById('play-again').addEventListener('click', startGame);
            document.getElementById('back-to-start').addEventListener('click', backToStart);
        } else {
            game.innerHTML += `<button class="next-question">Next question</button>`;
            document.querySelector('.next-question').addEventListener('click', nextQuestionFunc);
            window.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    nextQuestionFunc();
                }
            });
        }
        answerChosen = true;
    }
}

function nextQuestionFunc() {
    if (answerChosen) {
        injectQuestion(questions, questionDataIndexIncrement);
        emptyClicks = 0;
        answerChosen = false;
    } else {
        emptyClicks++;
        if (emptyClicks >= 3) {
            alert('Please select an answer.');
        }
    }
}

function sortScores() {
    scores.sort((a, b) => b.score - a.score);
}

function deleteNonameScore() {
    const nonameObj = scores.find((obj) => 
        obj.name.toLowerCase() === 'No name'.toLowerCase()
    );
    const nonameIndex = scores.indexOf(nonameObj);
    console.log(typeof nonameIndex);
    if (nonameIndex !== -1) {
        scores.splice(nonameIndex, 1);
        localStorage.setItem('scores', JSON.stringify(scores));
    }
}

function deleteAllScores() {
    const confirmDelete = confirm("Are you sure you want to delete all scores?");
    if (confirmDelete) {
        scores = [];
        updateScore();
    }
    deleteScoreBtn.classList.add('hide');
}

function decodeCorrectAnswer(str) {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
}

function backToStart() {
    startMenu.style.display = 'inherit';
    game.style.display = 'none';
    scoreSection.style.display = 'inherit';
    currentPlayerScoreBoardSection.style.display = 'none';
    localStorage.setItem('scores', JSON.stringify(scores));
    sortScores();
}

function createCurrentScoreBoard() {
    currentPlayerScoreBoardSection.innerHTML = '';
    currentPlayerScoreBoardSection.innerHTML += `
    <h3 class="score-style-class">Current Score</h3>
    <table>
        <tbody id="current-player-score">
            <tr>
                <th>Name</th>
                <td>${playerName}</td>
            </tr>
                <th>Current Score</th>
                <td>${currentScore}</td>
            </tr>
                <th>Total Score</th>
                <td>${playerObject.score ? playerObject.score : 0}</td>
            </tr>
        </tbody>
    </table>
    <button id="quit">Quit game</button>
    `
    document.getElementById('quit').addEventListener('click', backToStart);
}

function updateScore() {
    sortScores();
    scoreBoard.innerHTML = '<tr><th>Name</th><th>Score</th></tr>';
    scores.forEach((scr) => {
        scoreBoard.innerHTML += `<tr><td>${scr.name}</td><td>${scr.score}</td></tr>`;
    })
    localStorage.setItem('scores', JSON.stringify(scores));
}

function getPlayerNameAndScore() {
    currentScore = 0;
    playerName = playerNameInput.value ? playerNameInput.value : 'No name';
    playerObject = scores.find((obj) => 
        playerName.toLowerCase() === obj.name.toLowerCase()
    );
    if (!playerObject) {
        deleteScoreBtn.classList.remove('hide');
        scores.push({name: playerName,
            score: 0
        });
        playerObject = scores[scores.length - 1];
        currentScore = scores[scores.length - 1].score;
        localStorage.setItem('scores', JSON.stringify(scores));
    }
}


function startGame() {
    answerChosen = false;
    getPlayerNameAndScore();
    getQuestions();
    updateScore();
    createCurrentScoreBoard()
    startMenu.style.display = 'none';
    game.style.display = 'inherit';
    scoreSection.style.display = 'none';
    currentPlayerScoreBoardSection.style.display = 'inherit';
}

async function getQuestions() {
    try {
        questionDataIndexIncrement = 0;
        const link = await generateLink();
        const response = await fetch(link);
        questions = '';
        questions = await response.json();
        injectQuestion(questions);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }
    } catch (err) {
        console.error('Error fetching questions:', err);
        alert('Question fetching failed.');
    }
}

function injectQuestion(data) {
    correctAnswer = decodeCorrectAnswer(data.results[questionDataIndexIncrement].correct_answer);
    const incorrectAnswers = data.results[questionDataIndexIncrement].incorrect_answers;
    incorrectAnswers.splice(Math.floor(Math.random() * (incorrectAnswers.length + 1)), 0, correctAnswer);
    game.innerHTML = '';
    game.innerHTML += `<h3 id="question-number">Question ${questionDataIndexIncrement + 1}</h3><span id="difficulty">(${data.results[questionDataIndexIncrement].difficulty})</span><p>${data.results[questionDataIndexIncrement].question}</p>`;
    incorrectAnswers.forEach((ans) => {
        game.innerHTML += `<button class="answer-buttons">${ans}</button>`;
    })
    difficulty = document.getElementById('difficulty').innerText;
    answerButtons = document.querySelectorAll('.answer-buttons');
    answerButtons.forEach((button) => {
        button.addEventListener('click', selectAnswer);
    });
    if (questionDataIndexIncrement < data.results.length) {
        questionDataIndexIncrement++;
    } else {
        alert('No more questions.')
    }
}


async function generateLink() {
    try {
        let link;
        let tokenToGet;
        const questionNumberSelected = numberOfQuestionsInput.value;
        if (!tokenObj.token || Date.now >= tokenObj.date) {
            tokenToGet = await tokenGet();
            tokenObj.token = tokenToGet;
            tokenObj.date = Date.now() + (6 * 60 * 60 * 1000);
        } else {
            tokenToGet = tokenObj.token;
        }
        const categoryValue = dropdownCategories.value;
        link = `${databaseLink}amount=${questionNumberSelected}`;
        if (Number(categoryValue)) {
            link += `&category=${categoryValue}`;
        }
        if (difficultyToSelect.value !== 'none') {
            link += `&difficulty=${difficultyToSelect.value}`;
        }
        link += `&token=${tokenToGet}`;
        return link;
    } catch (err) {
        alert('Link generation failed.');
    }
}

async function tokenGet() {
    try {
        const response = await fetch('https://opentdb.com/api_token.php?command=request');
        const parsedToken = await response.json();
        return parsedToken.token;
    } catch (err) {
        alert('Token retrieval failed.');
    }
}



async function getCategories() {
    try {
        const response = await fetch(categoryListLink);
        const categories = await response.json();
        appendCategories(categories["trivia_categories"]);
    } catch (err) {
        alert('Categories retrieval failed.');
    }
}

function appendCategories(categories) {
    categories.forEach((cat) => {
        dropdownCategories.innerHTML += `<option id="${cat.id}" value="${cat.id}" name="${cat.name.replace(/\s/g, '-').replace(/[^a-zA-Z0-9\-]/g, '').replace("--", "-")}">${cat.name}</option>`;
        categoriesArr.push(cat);
    })
}

window.addEventListener("load", () => {
    numberOfQuestionsInput.value = 10;
    console.log(scores);
    getCategories();
    deleteNonameScore();
    updateScore();
    console.log(scores);
    if (scores.length === 0) {
        deleteScoreBtn.classList.add('hide');
    }
    sortScores();
})

startBtn.addEventListener('click', startGame);

deleteScoreBtn.addEventListener('click', deleteAllScores);
