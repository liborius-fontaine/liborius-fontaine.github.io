/* ======================================
   EXPLORE BENIN - QUIZ
====================================== */

const quizQuestions = [
    {
        question: "Quelle est la capitale officielle du Bénin ?",
        answers: ["Cotonou", "Porto-Novo", "Parakou", "Abomey"],
        correct: "Porto-Novo"
    },
    {
        question: "Quelle ville est connue pour la Porte du Non-Retour ?",
        answers: ["Pendjari", "Ganvié", "Ouidah", "Dassa"],
        correct: "Ouidah"
    },
    {
        question: "Quel parc national est connu pour sa faune sauvage ?",
        answers: ["Pendjari", "Abomey", "Grand-Popo", "Porto-Novo"],
        correct: "Pendjari"
    },
    {
        question: "Comment appelle-t-on le célèbre village lacustre du Bénin ?",
        answers: ["Ouidah", "Ganvié", "Kétou", "Natitingou"],
        correct: "Ganvié"
    },
    {
        question: "Quelle ville est connue pour ses palais royaux ?",
        answers: ["Cotonou", "Grand-Popo", "Abomey", "Parakou"],
        correct: "Abomey"
    }
];

const quizQuestion = document.querySelector("#quiz-question");
const quizAnswers = document.querySelector("#quiz-answers");
const quizNext = document.querySelector("#quiz-next");
const quizResult = document.querySelector("#quiz-result");
const quizProgress = document.querySelector("#quiz-progress");

// Le script ne s'exécute que si la section quiz est présente dans la page.
if (quizQuestion && quizAnswers && quizNext && quizResult && quizProgress) {
    let currentQuestion = 0;
    let score = 0;
    let selectedAnswer = null;
    let quizFinished = false;

    function showQuestion() {
        const question = quizQuestions[currentQuestion];
        selectedAnswer = null;

        quizQuestion.textContent = question.question;
        quizAnswers.innerHTML = "";
        quizResult.textContent = "";
        quizProgress.textContent = `Question ${currentQuestion + 1} / ${quizQuestions.length}`;
        quizNext.textContent = "Question suivante";
        quizNext.disabled = true;

        question.answers.forEach(answer => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = answer;
            button.classList.add("quiz-answer");

            button.addEventListener("click", () => {
                if (selectedAnswer !== null) return;

                selectedAnswer = answer;

                const isCorrect = answer === question.correct;
                if (isCorrect) {
                    score++;
                    quizResult.textContent = "Bonne réponse !";
                } else {
                    quizResult.textContent = `Pas tout à fait. La bonne réponse était : ${question.correct}.`;
                }

                quizAnswers.querySelectorAll("button").forEach(answerButton => {
                    if (answerButton.textContent === question.correct) {
                        answerButton.classList.add("correct");
                    } else if (answerButton.textContent === selectedAnswer) {
                        answerButton.classList.add("incorrect");
                    }

                    answerButton.disabled = true;
                });

                quizNext.disabled = false;
            });

            quizAnswers.appendChild(button);
        });
    }

    function showResult() {
        quizFinished = true;
        quizQuestion.textContent = "Quiz terminé !";
        quizAnswers.innerHTML = "";
        quizProgress.textContent = "Résultat final";
        quizResult.textContent = `Tu as obtenu ${score} / ${quizQuestions.length} bonnes réponses !`;
        quizNext.textContent = "Recommencer";
        quizNext.disabled = false;
    }

    function restartQuiz() {
        currentQuestion = 0;
        score = 0;
        quizFinished = false;
        showQuestion();
    }

    quizNext.addEventListener("click", () => {
        if (quizFinished) {
            restartQuiz();
            return;
        }

        currentQuestion++;

        if (currentQuestion < quizQuestions.length) {
            showQuestion();
        } else {
            showResult();
        }
    });

    showQuestion();
}
