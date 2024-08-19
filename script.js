document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("randomProblemButton");
    const yearSelector = document.getElementById("yearSelector");
    const problemSelector = document.getElementById("problemSelector");
    const problemDiv = document.getElementById("problem");
    const darkModeToggle = document.getElementById("darkModeToggle");

    const lockYearCheckbox = document.getElementById("lockYear");
    const lockProblemCheckbox = document.getElementById("lockProblem");

    let problems = {};

    // Fetch the JSON file
    fetch('putnam_problems.json')
        .then(response => response.json())
        .then(data => {
            problems = data;
            populateYearSelector();
            displayRandomProblem(); // Display a random problem after loading the JSON data
        })
        .catch(error => console.error('Error fetching the JSON file:', error));

    button.addEventListener("click", displayRandomProblem);
    yearSelector.addEventListener("change", populateProblemSelector);
    problemSelector.addEventListener("change", displaySelectedProblem);
    darkModeToggle.addEventListener("click", toggleDarkMode);

    function populateYearSelector() {
        const years = Object.keys(problems).sort();
        years.forEach(year => {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            yearSelector.appendChild(option);
        });
    }

    function populateProblemSelector() {
        const selectedProblemKey = problemSelector.value;  // Save the currently selected problem
        problemSelector.innerHTML = '<option value="">Select Problem</option>';
        const selectedYear = yearSelector.value;
        if (selectedYear) {
            const problemsInYear = Object.keys(problems[selectedYear]).sort();
            problemsInYear.forEach(problemKey => {
                const problemLabel = problemKey.replace("\\item[", "").replace("]", "").replace("--", "");
                const option = document.createElement("option");
                option.value = problemKey;
                option.textContent = problemLabel;
                problemSelector.appendChild(option);
            });
            // Restore the previously selected problem if it exists in the new year's problem set
            if (problemsInYear.includes(selectedProblemKey)) {
                problemSelector.value = selectedProblemKey;
            }
        }
    }

    function displayRandomProblem() {
        if (Object.keys(problems).length === 0) {
            problemDiv.innerHTML = "<p>Loading problems... Please try again.</p>";
            return;
        }

        let selectedYear = yearSelector.value;
        let selectedProblemKey = problemSelector.value;

        if (!lockYearCheckbox.checked) {
            const years = Object.keys(problems);
            selectedYear = years[Math.floor(Math.random() * years.length)];
        }

        if (!lockProblemCheckbox.checked) {
            const problemsInYear = problems[selectedYear];
            const problemKeys = Object.keys(problemsInYear);
            selectedProblemKey = problemKeys[Math.floor(Math.random() * problemKeys.length)];
        }

        // Set the dropdowns to the random year and problem (or locked ones)
        yearSelector.value = selectedYear;
        populateProblemSelector();
        problemSelector.value = selectedProblemKey;

        displayProblem(selectedYear, selectedProblemKey);
    }

    function displaySelectedProblem() {
        const selectedYear = yearSelector.value;
        const selectedProblemKey = problemSelector.value;
        if (selectedYear && selectedProblemKey) {
            displayProblem(selectedYear, selectedProblemKey);
        }
    }

    function displayProblem(year, problemKey) {
        const problemData = problems[year][problemKey];
        const problemText = problemData.problem_text.replace(/\\item\[.*?\]\s*/, '');
        const difficultyRating = problemData.difficulty_rating;
        const heading = `${year} ${problemKey.replace("\\item[", "").replace("]", "").replace("--", "")}`;
        
        let stars = '';
        if (difficultyRating !== null) {
            stars = `
                <div class="stars-container">
                    <div class="stars-outer">
                        <div class="stars-inner" style="width: ${(difficultyRating / 5) * 100}%;"></div>
                    </div>
                </div>
            `;
        }

        problemDiv.innerHTML = `<h2>${heading}</h2>${stars}<div class="math-content">${problemText}</div>`;

        // Ensure MathJax re-renders the new content
        if (window.MathJax) {
            MathJax.typesetPromise([problemDiv]).catch((err) => console.log(err.message));
        }
    }

    function toggleDarkMode() {
        const themeStylesheet = document.getElementById("themeStylesheet");
        if (themeStylesheet.getAttribute("href") === "light-theme.css") {
            themeStylesheet.setAttribute("href", "dark-theme.css");
            localStorage.setItem("theme", "dark");
        } else {
            themeStylesheet.setAttribute("href", "light-theme.css");
            localStorage.setItem("theme", "light");
        }
    }

    // Load the saved theme preference
    function loadThemePreference() {
        const savedTheme = localStorage.getItem("theme");
        const themeStylesheet = document.getElementById("themeStylesheet");
        if (savedTheme === "dark") {
            themeStylesheet.setAttribute("href", "dark-theme.css");
        } else {
            themeStylesheet.setAttribute("href", "light-theme.css");
        }
    }

    loadThemePreference();
});
