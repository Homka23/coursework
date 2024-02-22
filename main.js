
class HashTable {
    constructor(initialSize = 100) {
        this.table = new Array(initialSize);
    }

    hash(key) {
        const prime = 31;
        const randomMultiplier = 7; // Випадковий множник

        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = (hash * prime + key.charCodeAt(i)) % this.table.length;
        }

        // Використовується додатковий випадковий множник
        hash = (hash * randomMultiplier) % this.table.length;

        return hash;
    }

    generateKey(date, theme) {
        let index = this.hash(`${date}_${theme}`);
        let attempt = 1;

        while (this.table[index] && this.table[index].length > 0) {
            index = (index + attempt) % this.table.length;
            attempt++;
        }

        return `${date}_${theme}_${attempt}`;
    }

    add(date, theme, description) {
        const key = this.generateKey(date, theme);
        const index = this.hash(key);

        if (!this.table[index]) {
            this.table[index] = [];
        }

        this.table[index].push({ date, theme, description });

        this.display(this.table);
    }

    display(tableToDisplay) {
        const output = document.getElementById('hashTableOutput');
        // Clear content before displaying new records
        output.innerHTML = '';

        console.log('HashTable Contents:');
        tableToDisplay.forEach((bucket, index) => {
            if (bucket) {
                bucket.forEach((item) => {
                    const container = document.createElement('div');
                    container.className = 'record-container';
                    container.innerHTML = `
                    <i><p>${item.date}</p></i>
                    <b><p class="theme">${item.theme}</p></b>
                    <p>${item.description}</p>
                `;
                    container.onclick = () => this.toggleRecordSelection(container);

                    output.appendChild(container);
                });
            } else {
                const emptyMessage = document.createElement('p');
                emptyMessage.textContent = `Bucket ${index}: Empty`;
                output.appendChild(emptyMessage);
            }
        });

        this.clearInputs();
    }

    toggleRecordSelection(container) {
        const isSelected = container.classList.toggle('selected');
        const date = container.querySelector('i p').textContent; // Assuming 'i' is the parent container for date
        const theme = container.querySelector('b p.theme').textContent; // Assuming 'b' is the parent container for theme
        const description = container.querySelector('p:nth-child(3)').textContent;

        const record = {
            date: date,
            theme: theme,
            description: description,
            selected: isSelected,
        };
        container.record = record;
    }

    displayArray(arrayToDisplay) {
        const output = document.getElementById('hashTableOutput');
        // Clear content before displaying new records
        output.innerHTML = '';

        console.log('Data Array:');
        arrayToDisplay.forEach((item) => {
            const container = document.createElement('div');
            container.className = 'record-container';
            container.innerHTML = `
                    <i><p>${item.date}</p></i>
                    <b><p class="theme">${item.theme}</p></b>
                    <p>${item.description}</p>
            `;
            container.onclick = () => this.toggleRecordSelection(container);

            output.appendChild(container);
        });

        this.clearInputs();
    }
    clearInputs() {
        document.getElementById('date').value = '';
        document.getElementById('theme').value = '';
        document.getElementById('description').value = '';
        document.getElementById('searchTheme').value = '';
        document.getElementById('searchDate').value = '';
    }

}

const myHashTable = new HashTable();
function addRecord() {
    const dateInput = document.getElementById('date').value;
    const themeInput = document.getElementById('theme').value;
    const descriptionInput = document.getElementById('description').value;

    // Перевірка, чи вказана дата
    if (!dateInput) {
        alert('Будь ласка, вкажіть дату запису.');
        return; // Припинення виконання функції в разі відсутності дати
    }

    // Prepare data for sending to the server
    const recordToAdd = {
        date: dateInput,
        theme: themeInput,
        description: descriptionInput,
    };
    myHashTable.add(dateInput, themeInput, descriptionInput);
    myHashTable.display(myHashTable.table);

}

function deleteSelectedRecords() {
    const selectedRecords = [];
    const recordContainers = document.querySelectorAll('.record-container');

    recordContainers.forEach((container) => {
        if (container.classList.contains('selected')) {
            const dateElement = container.querySelector('i p');
            const themeElement = container.querySelector('b p.theme');
            const descriptionElement = container.querySelector('p:nth-child(3)');

            if (dateElement && themeElement && descriptionElement) {
                const date = dateElement.textContent.trim();
                const theme = themeElement.textContent.trim();
                const description = descriptionElement.textContent.trim();

                const key = myHashTable.generateKey(date, theme);
                const index = myHashTable.hash(key);

                // Find and remove the selected record from the local hash table without using .filter()
                const tableItems = myHashTable.table[index];
                if (tableItems) {
                    myHashTable.table[index] = [];
                    for (let i = 0; i < tableItems.length; i++) {
                        const item = tableItems[i];
                        if (!(item.date === date && item.theme === theme && item.description === description)) {
                            myHashTable.table[index].push(item);
                        }
                    }
                } else {
                    console.error(`Table items at index ${index} is undefined or does not have 'length'.`);
                }

                selectedRecords.push({ date, theme, description });
                container.remove();
            }
        }
    });

    // Remove the selected records from the server using DELETE method
    if (selectedRecords.length > 0) {
        fetch('https://my-json-server.typicode.com/Homka23/coursework/db', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ records: selectedRecords }),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Selected Records deleted from the server:', data);
            })
            .catch(error => console.error('Error deleting records from the server:', error));
    }

    console.log('Selected Records:', selectedRecords);
}

function searchRecords() {
    const searchThemeInput = document.getElementById('searchTheme').value.toLowerCase();
    const searchDateInput = document.getElementById('searchDate').value;

    const filteredRecords = [];
    for (const bucket of myHashTable.table) {
        if (Array.isArray(bucket)) {
            for (const item of bucket) {
                const themeMatches = searchThemeInput === '' || item.theme.toLowerCase().includes(searchThemeInput);
                const dateMatches = searchDateInput === '' || item.date === searchDateInput;

                if (themeMatches && dateMatches) {
                    filteredRecords.push(item);
                }
            }
        }
    }

    displaySearchResults(filteredRecords);
    myHashTable.clearInputs();
}

function displaySearchResults(searchResults) {
    const output = document.getElementById('hashTableOutput');
    output.innerHTML = ''; // Clear content before displaying new records

    console.log('Search Results:');
    searchResults.forEach(item => {
        const container = document.createElement('div');
        container.className = 'record-container';
        container.innerHTML = `
            <i><p>${item.date}</p></i>
            <b><p class="theme">${item.theme}</p></b>
            <p>${item.description}</p>
        `;
        container.onclick = () => myHashTable.toggleRecordSelection(container);

        output.appendChild(container);
    });

    myHashTable.clearInputs();
}

function fetchDataFromServer() {
    const apiUrl = 'https://my-json-server.typicode.com/Homka23/coursework/db';
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => handleJsonData(data))
        .catch(error => console.error('Error fetching data from server:', error));
}

function handleJsonData(data) {
    if (data && Array.isArray(data.db)) {
        // Clear existing records in the hash table
        myHashTable.table = new Array(myHashTable.table.length);

        // Add new records from the fetched data
        data.db.forEach(item => {
            myHashTable.add(item.date, item.theme, item.description);
        });

        // Update the display
        myHashTable.display(myHashTable.table);
    } else {
        console.error('Invalid JSON data format.');
    }
}

// Функція сортування масиву структур за допомогою методу вставки
function sortArrayOfStructures(dataArray) {
    for (let i = 1; i < dataArray.length; i++) {
        const currentRecord = dataArray[i];
        let j = i - 1;

        while (j >= 0 && new Date(dataArray[j].date) < new Date(currentRecord.date)) {
            dataArray[j + 1] = dataArray[j];
            j--;
        }

        dataArray[j + 1] = currentRecord;
    }

    return dataArray;
}

function sortAndDisplayArrayExternally() {
    // Створення масиву структур
    const dataArray = [];

    // Зчитування даних з хеш-таблиці і заповнення масиву структур
    myHashTable.table.forEach((bucket) => {
        if (bucket) {
            bucket.forEach((item) => {
                dataArray.push({
                    date: item.date,
                    theme: item.theme,
                    description: item.description,
                });
            });
        }
    });

    // Сортування масиву за допомогою функції сортування
    let sortedArray = sortArrayOfStructures(dataArray);

    // Виведення відсортованого масиву
    myHashTable.displayArray(sortedArray);
}

fetchDataFromServer();


//
// d:
// cd University
// cd coursework
// cd course_work
// json-server --watch db.json -p 3001