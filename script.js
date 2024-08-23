document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("randomProblemButton");
    const yearSelector = document.getElementById("yearSelector");
    const problemSelector = document.getElementById("problemSelector");
    const problemDiv = document.getElementById("problem");
    const darkModeToggle = document.getElementById("darkModeToggle");

    // const lockYearCheckbox = document.getElementById("lockYear");
    // const lockProblemCheckbox = document.getElementById("lockProblem");

    const minDifficultySlider = document.getElementById("minDifficulty");
    const maxDifficultySlider = document.getElementById("maxDifficulty");
    const difficultyLabel = document.getElementById("difficultyLabel");

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

    minDifficultySlider.addEventListener("input", handleMinDifficultyChange);
    maxDifficultySlider.addEventListener("input", handleMaxDifficultyChange);

    function updateDifficultyLabel() {
        const minDifficulty = parseFloat(minDifficultySlider.value);
        const maxDifficulty = parseFloat(maxDifficultySlider.value);
        difficultyLabel.textContent = `${minDifficulty.toFixed(1)} - ${maxDifficulty.toFixed(1)}`;
    }

    function handleMinDifficultyChange() {
        const minDifficulty = parseFloat(minDifficultySlider.value);
        const maxDifficulty = parseFloat(maxDifficultySlider.value);
        
        // Ensure the min slider cannot go beyond the max slider
        if (minDifficulty > maxDifficulty) {
            minDifficultySlider.value = maxDifficulty;
        }

        updateDifficultyLabel();
    }

    function handleMaxDifficultyChange() {
        const minDifficulty = parseFloat(minDifficultySlider.value);
        const maxDifficulty = parseFloat(maxDifficultySlider.value);
        
        // Ensure the max slider cannot go below the min slider
        if (maxDifficulty < minDifficulty) {
            maxDifficultySlider.value = minDifficulty;
        }

        updateDifficultyLabel();
    }

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
        const selectedProblemKey = problemSelector.value; // Store the currently selected problem key
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

            // Set the problem selector back to the previously selected problem key
            if (problemsInYear.includes(selectedProblemKey)) {
                problemSelector.value = selectedProblemKey;
            } else {
                problemSelector.value = ''; // If the selected problem is not in the new year, reset it
            }
        }

        // After repopulating the problem selector, display the problem for the current selection
        displaySelectedProblem();
    }

    function displayRandomProblem() {
        if (Object.keys(problems).length === 0) {
            problemDiv.innerHTML = "<p>Loading problems... Please try again.</p>";
            return;
        }
    
        const minDifficulty = parseFloat(minDifficultySlider.value);
        const maxDifficulty = parseFloat(maxDifficultySlider.value);
    
        // If the year is locked, filter within the selected year, otherwise filter across all years
        // let availableYears = lockYearCheckbox.checked ? [yearSelector.value] : Object.keys(problems);

        let availableYears = Object.keys(problems);
    
        const filteredProblems = {};
    
        availableYears.forEach(year => {
            const yearProblems = problems[year];
            filteredProblems[year] = {};
            for (const key in yearProblems) {
                const difficulty = yearProblems[key].difficulty_rating;
                if (difficulty >= minDifficulty && difficulty <= maxDifficulty) {
                    filteredProblems[year][key] = yearProblems[key];
                }
            }
        });
    
        // Remove any years that have no problems within the difficulty range
        availableYears = availableYears.filter(year => Object.keys(filteredProblems[year]).length > 0);
    
        if (availableYears.length === 0) {
            problemDiv.innerHTML = "<p>No problems found within the selected difficulty range.</p>";
            return;
        }
    
        let selectedYear = yearSelector.value;
        let selectedProblemKey;
    
        // if (!lockYearCheckbox.checked) {
        //     selectedYear = availableYears[Math.floor(Math.random() * availableYears.length)];
        // }
        selectedYear = availableYears[Math.floor(Math.random() * availableYears.length)];
    
        const availableProblems = Object.keys(filteredProblems[selectedYear]);
        // if (!lockProblemCheckbox.checked) {
        //     selectedProblemKey = availableProblems[Math.floor(Math.random() * availableProblems.length)];
        // } else {
        //     selectedProblemKey = problemSelector.value;
        // }
        selectedProblemKey = availableProblems[Math.floor(Math.random() * availableProblems.length)];
    
        // Set the dropdowns to the random year and problem (or locked ones)
        yearSelector.value = selectedYear;
        populateProblemSelector(); // This will call displaySelectedProblem to update the view
    
        // Manually set the problem selector to the locked or randomly chosen problem
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
        let problemData = problems[year][problemKey];
        let problemText = problemData.problem_text
            .replace(/\\\\/g, '\\') // Replace double slashes with single slash
            .replace(/\\item\[[^\]]+\]\s*\n?/, ''); // Remove initial \item[...] text

        // Convert LaTeX enumerate/itemize to HTML
        problemText = problemText
            .replace(/\\begin{enumerate}/g, '<ol>')
            .replace(/\\end{enumerate}/g, '</ol>')
            .replace(/\\begin{itemize}/g, '<ul>')
            .replace(/\\end{itemize}/g, '</ul>')
            // Handle custom item labels in enumerate (e.g., \item[(i)])
            .replace(/\\item\[(.*?)\]/g, '<li style="list-style-type:none;"><span>$1</span> ')
            // Handle standard items
            .replace(/\\item/g, '<li>');

        // Convert LaTeX text formatting commands to HTML
        problemText = problemText
            .replace(/\\textbf{([^}]*)}/g, '<b>$1</b>')  // \textbf{} to <b></b>
            .replace(/\\textit{([^}]*)}/g, '<i>$1</i>')  // \textit{} to <i></i>
            .replace(/\\emph{([^}]*)}/g, '<i>$1</i>');   // \emph{} to <i></i>

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
