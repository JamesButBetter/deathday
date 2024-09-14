const defaultPeople = ["Albert Einstein", "Elizabeth II", "Leonardo da Vinci"];
const defaultLifeExpectancy = 76; // Default life expectancy if country-specific data is unavailable

async function getCountryLifeExpectancy(country) {
    // This is a placeholder function. In a real-world scenario, you'd use an API or database to fetch this data.
    // For now, we'll return some sample data
    const lifeExpectancies = {
        "United States": 78.5,
        "United Kingdom": 81.2,
        "Japan": 84.3,
        // Add more countries as needed
    };
    return lifeExpectancies[country] || defaultLifeExpectancy;
}

// Fetch live suggestions from Wikipedia's Opensearch API
async function getSuggestions() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value;
    const suggestionsList = document.getElementById('suggestions');

    // Clear suggestions if no input
    if (!query) {
        suggestionsList.innerHTML = '';
        return;
    }

    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${encodeURIComponent(query)}&limit=10`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Clear previous suggestions
        suggestionsList.innerHTML = '';

        // Display suggestions in a dropdown
        data[1].forEach((suggestion) => {
            const listItem = document.createElement('li');
            listItem.textContent = suggestion;
            listItem.onclick = () => searchWikipedia(suggestion); // When clicked, search for this suggestion
            suggestionsList.appendChild(listItem);
        });

    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

// Search Wikipedia for selected suggestion and fetch birthday
async function searchWikipedia(name) {
    const suggestionsList = document.getElementById('suggestions');

    // Clear suggestions
    suggestionsList.innerHTML = '';

    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts|pageprops|pageimages&piprop=thumbnail&pithumbsize=100&explaintext&titles=${encodeURIComponent(name)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0]; // Get the first page ID
        const page = pages[pageId];

        if (page.missing) {
            alert('No results found!');
            return;
        }

        // Extract the birthday from the extract or page props
        const birthdayRegex = /born.*?(\d{1,2}\s\w+\s\d{4})/i;
        const extract = page.extract;
        const match = birthdayRegex.exec(extract);

        const thumbnail = page.thumbnail ? page.thumbnail.source : 'https://via.placeholder.com/50'; // Default image if no thumbnail

        if (match) {
            const birthday = new Date(match[1]);
            const deathRegex = /died.*?(\d{1,2}\s\w+\s\d{4})/i;
            const deathMatch = deathRegex.exec(extract);
            const deathday = deathMatch ? new Date(deathMatch[1]) : null;

            // Get country (this is a simplified approach, you might need a more robust method)
            const countryRegex = /(?:born|raised) in ([^,.]+)/i;
            const countryMatch = countryRegex.exec(extract);
            const country = countryMatch ? countryMatch[1].trim() : "Unknown";

            const lifeExpectancy = await getCountryLifeExpectancy(country);
            
            addPerson(name, birthday, deathday, thumbnail, country, lifeExpectancy);
        } else {
            alert('Birthday not found in the Wikipedia entry!');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function addPerson(name, birthday, deathday, thumbnail, country, lifeExpectancy) {
    const peopleContainer = document.getElementById('peopleContainer');

    const personDiv = document.createElement('div');
    personDiv.className = 'person';

    const imageElem = document.createElement('img');
    imageElem.src = thumbnail;
    personDiv.appendChild(imageElem);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'person-info';

    const nameElem = document.createElement('p');
    nameElem.innerHTML = `<strong>${name}</strong>`;
    infoDiv.appendChild(nameElem);

    const birthdayElem = document.createElement('p');
    birthdayElem.textContent = `Born: ${birthday.toDateString()}`;
    infoDiv.appendChild(birthdayElem);

    const currentDate = new Date();
    const age = currentDate.getFullYear() - birthday.getFullYear();
    
    // Use default life expectancy if country is unknown
    if (country === "Unknown") {
        lifeExpectancy = defaultLifeExpectancy;
    }

    let deathdayElem, remainingTimeElem;
    if (deathday) {
        deathdayElem = document.createElement('p');
        deathdayElem.textContent = `Died: ${deathday.toDateString()}`;
        infoDiv.appendChild(deathdayElem);
    } else {
        const predictedDeathday = new Date(birthday.getTime());
        predictedDeathday.setFullYear(birthday.getFullYear() + Math.ceil(lifeExpectancy));
        
        deathdayElem = document.createElement('p');
        deathdayElem.textContent = `Predicted death: ${predictedDeathday.toDateString()}`;
        infoDiv.appendChild(deathdayElem);

        remainingTimeElem = document.createElement('p');
        remainingTimeElem.className = 'remaining-time';
        infoDiv.appendChild(remainingTimeElem);

        // Update remaining time every second
        setInterval(() => {
            const now = new Date();
            const timeLeft = predictedDeathday.getTime() - now.getTime();
            if (timeLeft > 0) {
                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                remainingTimeElem.textContent = `Time left: ${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else {
                remainingTimeElem.textContent = 'Time left: 0d 0h 0m 0s';
            }
        }, 1000);
    }

    personDiv.appendChild(infoDiv);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => personDiv.remove();
    personDiv.appendChild(deleteBtn);

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';

    const progressBarInner = document.createElement('div');
    progressBarInner.className = 'progress-bar-inner';

    const lifePercentage = deathday ? 100 : (age / lifeExpectancy) * 100;

    progressBarInner.style.width = `${Math.min(lifePercentage, 100)}%`;
    progressBar.appendChild(progressBarInner);

    personDiv.appendChild(progressBar);
    peopleContainer.appendChild(personDiv);
}// Initialize default people
function initializeDefaults() {
    defaultPeople.forEach(person => searchWikipedia(person));
}

// Run on load
window.onload = initializeDefaults;