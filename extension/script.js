// console.log = () => {};

const TestAuth = {userId: 468106723, channelId: 468106723}
const TESTING = window.location.hostname === "localhost";

DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    if ('target' in node) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noreferrer');
    }
});

function follow_button(channelName) {
    console.log(channelName);
    window.Twitch.ext.actions.followChannel(channelName);
    console.log("finished following")
}

// initially set to 1080p, gets set by local player and websocket
let playerWidth = 1340;
let playerHeight = 751; // 1080p in
let obsOutputWidth = 1920;
let obsOutputHeight = 1080;

let infoWindowData = {};
let userId = ""; // Declare userId in the global scope
let popupTimeout; // Store the timeout ID

// Add the drag-and-drop functionality for the obs-container
let isDragging = false;
let draggedElement = null;
let rect = null;
let dragCooldown = false; // Cooldown flag to prevent rapid dragging
let offsetX = 0;
let offsetY = 0;
let draggedElementBounds = null;
let obsScreenData = [];
let jwtToken = '';

let windowBounds = {};
const defaultBounds = {left: 0, top: 0, right: 1, bottom: 1}; // Full container

const obsContainer = document.getElementById("obs-container");

function updateObsScreen(data) {
    for (let obsWindow of data) {
        console.log("obsWindow", obsWindow);
        if (Array.isArray(obsWindow['data'])) {
            console.log(obsWindow['data'][0]);
            obsWindow = obsWindow['data'][0];
            console.log("obsWindow is an array, using first element", obsWindow);
        }

        console.log("obsWindow", obsWindow);
        let node = document.getElementById(obsWindow.name);
        if (node === null) {
            console.log("creating new node for", obsWindow.name);

            node = document.createElement("div");
            node.id = obsWindow.name;
            node.classList.add("draggableWindow");

            obsContainer.appendChild(node);

            // Add the new class for info popups
            if (obsWindow.hasOwnProperty("info")) {
                node.classList.add("infoWindow");
                const infoIcon = document.createElement("div");
                infoIcon.classList.add("infoIcon");
                infoIcon.innerText = "i"; // You can replace this with an icon or image

                // Position the info icon inside the window
                infoIcon.style.position = "absolute";
                infoIcon.style.top = "5px";
                infoIcon.style.right = "5px";
                infoIcon.style.cursor = "pointer";

                // Add event listeners to the info icon
                addInfoIconListeners(infoIcon);

                // Append the info icon to the window node
                node.appendChild(infoIcon);
            }
        }
        let x = `${(obsWindow.x / obsOutputWidth) * 100}%`;
        let y = `${(obsWindow.y / obsOutputHeight) * 100}%`;

        node.style.left = x;
        node.style.top = y;
        console.log(obsWindow);
        console.log("width data: ", obsWindow.width, playerWidth, obsWindow.width.split('p')[0] / obsOutputWidth * playerWidth);
        console.log("height data: ", obsWindow.height, playerHeight, obsWindow.height.split('p')[0] / obsOutputHeight * playerHeight);
        node.style.width = Math.min(Math.max(obsWindow.width.split('p')[0] / obsOutputWidth * playerWidth, 0), obsOutputWidth) + "px"; // obsWindow.width;
        node.style.height = Math.min(Math.max(obsWindow.height.split('p')[0] / obsOutputHeight * playerHeight, 0), obsOutputHeight) + "px"; // obsWindow.height;

        // run some calculation for the zIndex -- or do on backend with obsWindow.zIndex
        node.style.zIndex = Math.max(1000 - parseInt((Math.min(Math.max(obsWindow.width.split('p')[0] / obsOutputWidth * playerWidth, 0), obsOutputWidth) +
                             Math.min(Math.max(obsWindow.height.split('p')[0] / obsOutputHeight * playerHeight, 0), obsOutputHeight))/10),1);
    }
}

function resetObsmap() {
    let units = Array.from(document.getElementsByClassName("draggableWindow"));
    if (units.length !== 0) {
        let container = document.getElementById("obs-container");
        container.style.display = "";
    }
    for (const unit of units) {
        unit.remove();
    }
}

function setupInfoPopupHandlers(infoIcon) {
    let hoverTimeout;
    // Show popup on mouse over
    infoIcon.addEventListener("mouseover", (e) => {
        e.stopPropagation();
        if(!isDragging) {
            hoverTimeout = setTimeout(() => {
            showPopup(e.target);
            }, 250);
        }
    });

    // Hide popup after a delay on mouse out
    infoIcon.addEventListener("mouseout", (_) => {
        clearTimeout(hoverTimeout);
        hidePopup();
    });
}

function addInfoIconListeners(infoIcon) {
    setupInfoPopupHandlers(infoIcon);
}

function showPopup(targetElement) {
    keepPopupOpen(popupTimeout); // Clear any pending timeouts

    const popup = document.getElementById("info-popup");
    const windowID = targetElement.closest('.infoWindow').id;
    const infoWindowElement = targetElement.closest('.infoWindow');
    const info = infoWindowData[windowID];

    if (info) {
        // Populate the popup with information
        // YES WE WANT IT UNINDENTED
        let markdownData = `
## ${info.title}

${info.description}`;

        marked.setOptions({
            gfm: true,       // Enable GitHub flavored markdown
            breaks: true,    // Enable line breaks
            sanitize: true, // Allow HTML tags
        });
        marked.use({
            renderer: {
                link(token) {
                    if (token.href === "FOLLOW_BUTTON") {
                        return `<button class="follow_button" data-channel="${token.text}">${token.text}</button>`
                    }
                    return `<a href="${token.href}" target="_blank">${token.text}</a>`
                }
            }
        })
        let html = marked.parse(markdownData);
        html = DOMPurify.sanitize(html);
        popup.innerHTML = html
        for (const button of popup.getElementsByClassName("follow_button")) {
            button.addEventListener("click", (event) => {
                follow_button(event.target.dataset.channel)
            })
        }

        // Ensure the popup is visible to get its dimensions
        popup.classList.remove('hidden');

        // Get bounding rectangles
        const windowRect = infoWindowElement.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Default position: above the info icon
        let popupLeft = windowRect.left + (windowRect.width - popupRect.width) / 2;
        let popupTop = windowRect.top + (windowRect.height - popupRect.height) / 2;

        // Adjust position if the popup goes off-screen horizontally
        if (popupLeft < 5) {
            popupLeft = 5; // Minimum 5px from the left edge
        } else if (popupLeft + popupRect.width > viewportWidth - 5) {
            popupLeft = viewportWidth - popupRect.width - 5; // Minimum 5px from the right edge
        }

        // Adjust position if the popup goes off-screen vertically
        if (popupTop < 5) { // 5px padding
            popupTop = 5;
        } else if (popupTop + popupRect.height > viewportHeight - 5) {
            popupTop = viewportHeight - popupRect.height - 5;
        }

        popup.style.left = popupLeft + 'px';
        popup.style.top = popupTop + 'px';
        popup.addEventListener("mouseover", keepPopupOpen);
        popup.addEventListener("mouseout", hidePopup);
    }
}

function hidePopup() {
    popupTimeout = setTimeout(() => {
        const popup = document.getElementById("info-popup");
        popup.classList.add('hidden');
        popup.style.left = '-9999px'; // Move off-screen
    }, 500); // Wait for 0.5 seconds before hiding
}

function keepPopupOpen() {
    clearTimeout(popupTimeout); // Clear the timeout to prevent hiding
}

function runGameJam(auth) {
    if (userId === "")
        userId = auth.userId; // Set userId here
    let wsUrl = "wss://websocket.matissetec.dev/lobby/connect?user=" + auth.channelId;
    let socket;
    let reconnectInterval = null; // To store the interval ID for reconnection attempts

    function connectWebSocket() {
        socket = new WebSocket(wsUrl);
        resetObsmap();

        socket.addEventListener("open", (_) => {
            console.log("Connected to the WebSocket server");
            let container = document.getElementById("obs-container");
            container.style.display = "initial";
            socket.send("Hello Server!");
            if (reconnectInterval) {
                clearInterval(reconnectInterval); // Clear the reconnect interval on successful connection
                reconnectInterval = null;
            }
        });

        socket.addEventListener("message", (event) => {
            if (event.data === "ping") {
                console.log("ping received");
                return;
            }
            console.log("has data")
            console.log(event)
            let eventData = JSON.parse(event.data);

            // If the data contains the screen configuration (like the windows to display)
            if (Array.isArray(eventData.data)) {
                obsScreenData = eventData.data;
                console.log("Screen data received:", obsScreenData);
                updateObsScreen(obsScreenData);
            } else {
                eventData = JSON.parse(eventData)
                console.log(eventData)
                // Check if the data contains window bounds
                if (eventData.hasOwnProperty("bounds")) {
                    // Update the windowBounds object with the received data
                    console.log("Bounds data received from WebSocket:", eventData.bounds);
                    windowBounds = eventData.bounds; // This updates the global windowBounds object
                }
                if (eventData.hasOwnProperty("infoWindow")) {
                    console.log("infoWindow data received from websocket: ", eventData.infoWindow)
                    infoWindowData = eventData.infoWindow
                }
                if (eventData.hasOwnProperty("obsSize")) {
                    console.log("obsSize data received from websocket: ", eventData.obsSize)
                    // obsOutputWidth = eventData.obsSize["width"] // target data for this
                    // obsOutputHeight = eventData.obsSize["height"]
                    obsOutputWidth = eventData.obsSize["obsSize"]["width"]
                    obsOutputHeight = eventData.obsSize["obsSize"]["height"]
                }
            }
        });

        socket.addEventListener("close", (_) => {
            console.log("Disconnected from the WebSocket server");
            // Attempt to reconnect every 10 seconds
            if (!reconnectInterval) {
                reconnectInterval = setInterval(() => {
                    console.log("Attempting to reconnect...");
                    try {
                        connectWebSocket();
                    }
                    catch (error) {
                        console.log("Failed to connect to WebSocket server:", error);
                    }
                }, 10000);
            }
        });

        socket.addEventListener("error", (event) => {
            let container = document.getElementById("obs-container");
            container.style.display = "none";
            console.log("WebSocket error, likely disconnected:", event);
        });
    }

    connectWebSocket();

    // Function to stop dragging
    window.addEventListener("mouseup", () => {
        // console.log("Mouse released");
        if (isDragging && draggedElement) {
            // Send the final position to the server
            const x = parseFloat(draggedElement.style.left) / 100;
            const y = parseFloat(draggedElement.style.top) / 100;
            const data = {
                name: draggedElement.id, // Assuming each draggableWindow has a unique id
                x: x,
                y: y,
                userId: userId,
                jwtToken: jwtToken
            };
            sendMessage(JSON.stringify(data));

        }
        isDragging = false;
        draggedElement = null;
        draggedElementBounds = null; // Reset bounds
        document.body.style.cursor = ''; // Reset cursor
        dragCooldown = true; // Set cooldown
        setTimeout(() => {dragCooldown = false;}, 100); // Cooldown for 100ms
    });

    function sendMessage(message) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        } else {
            console.error(
                "WebSocket is not open. Ready state:",
                socket.readyState,
            );
        }
    }
}

// Function to handle dragging
document.addEventListener("mousedown", (e) => {
    if (dragCooldown) return;

    let obsCont;
    // Ensure the draggableWindow is correctly identified even if a child element (like infoIcon) is clicked
    let target = e.target.closest(".draggableWindow");
    if (target) {
        isDragging = true;
        draggedElement = target;
        obsCont = document.getElementById("obs-container");
        rect = obsCont.getBoundingClientRect();
        document.body.style.cursor = 'grabbing';

        // Calculate the offset
        const elemRect = draggedElement.getBoundingClientRect();
        offsetX = e.clientX - elemRect.left;
        offsetY = e.clientY - elemRect.top;

        // Store the initial position of the draggedElement
        draggedElement.initialX = parseFloat(draggedElement.style.left) / 100;
        draggedElement.initialY = parseFloat(draggedElement.style.top) / 100;

        const windowID = draggedElement.id;
        console.log("this is the window bounds", windowBounds);
        draggedElementBounds = windowBounds[windowID] || defaultBounds;
    }
});

let mouseTimer;

document.addEventListener("mousemove", (e) => {
    if (isDragging && draggedElement) {
        const x = (e.clientX - rect.left - offsetX) / rect.width;
        const y = (e.clientY - rect.top - offsetY) / rect.height;

        // Get the element's size relative to the container
        const elemWidth = draggedElement.offsetWidth / rect.width;
        const elemHeight = draggedElement.offsetHeight / rect.height;

        // Calculate the constraints based on bounds
        const minX = draggedElementBounds.left;
        const maxX = draggedElementBounds.right - elemWidth;
        const minY = draggedElementBounds.top;
        const maxY = draggedElementBounds.bottom - elemHeight;

        // Constrain x and y within the calculated bounds
        const constrainedX = Math.max(minX, Math.min(maxX, x));
        const constrainedY = Math.max(minY, Math.min(maxY, y));

        // Update the position of the dragged element
        draggedElement.style.left = constrainedX * 100 + "%";
        draggedElement.style.top = constrainedY * 100 + "%";
    }
    document.body.classList.add('visible');

    clearTimeout(mouseTimer);
    // set a timer until windows disappear
    mouseTimer = setTimeout(() => {
        document.body.classList.remove('visible');
    }, 5000);
});

document.getElementById("obs-container").addEventListener("mouseleave", function(event){document.body.classList.remove('visible');});



if (TESTING) {
        const buttonsContainer = document.getElementById('bits-buttons-container');
        // Clear any existing buttons, this gets called every reauthorization
        buttonsContainer.innerHTML = '';

        for (let i = 0; i < 3; i++) {
            // Iterate through each product and create a button
            const button = document.createElement('button');

            const topText = document.createElement('span');
            topText.classList.add('top-text');
            topText.textContent = `TEST BIT`; // Top text (number range)

            const bottomText = document.createElement('span');
            bottomText.classList.add('bottom-text');
            bottomText.textContent = `bits 3794`; // Top text (number range)
            button.classList.add('bits-button');

            button.appendChild(topText);
            button.appendChild(document.createElement('br')); // Line break between top and bottom text
            button.appendChild(bottomText);
            buttonsContainer.appendChild(button);
        }
        runGameJam(TestAuth);
} else {
    // TODO FIX ME, this pops up every time even though it shouldnt
    if (!window.Twitch.ext.viewer.isLinked) {
        window.Twitch.ext.actions.requestIdShare();
    }

    window.Twitch.ext.onContext((context) => {
        // Get the player's width
        let resolutions = context.displayResolution.split("x");
        let newWidth = parseInt(resolutions[0], 10);  // Update playerWidth
        let newHeight = parseInt(resolutions[1], 10); // Update playerHeight
        if (newWidth !== playerWidth || newHeight !== playerHeight) {
            playerWidth = newWidth;
            playerHeight = newHeight;
            console.log("Player width:", playerWidth);
            console.log("Player height:", playerHeight);
            updateObsScreen(obsScreenData);
        }
    });
    window.Twitch.ext.onAuthorized(function (auth) {
        jwtToken = auth['token']
        // TODO this should be validated by the proxy server, for now we will do it this way
        userId = JSON.parse(atob(jwtToken.split('.')[1]))['user_id']

        Twitch.ext.bits.getProducts().then(function (products) {
            console.log(products); // [ { sku: 'abc123', cost: { type: 'bits', amount: '10' } } ]
            const buttonsContainer = document.getElementById('bits-buttons-container');
            // Clear any existing buttons, this gets called every reauthorization
            buttonsContainer.innerHTML = '';

            // Iterate through each product and create a button
            products.forEach(function (product) {
                const button = document.createElement('button');

                const topText = document.createElement('span');
                topText.classList.add('top-text');
                topText.textContent = `${product.displayName}`; // Top text (number range)

                const bottomText = document.createElement('span');
                bottomText.classList.add('bottom-text');
                bottomText.textContent = `bits ${product.cost.amount}`; // Top text (number range)

                button.appendChild(topText);
                button.appendChild(document.createElement('br')); // Line break between top and bottom text
                button.appendChild(bottomText);
                // Set the button text to display the amount of bits

                // Assign the SKU as a data attribute for later reference
                button.dataset.sku = product.sku;

                // Optionally, add a class for styling
                button.classList.add('bits-button');

                // Add an event listener for button clicks
                button.addEventListener('click', function () {
                    // Handle the button click
                    console.log("just clicked ", this.dataset.sku)
                    Twitch.ext.bits.useBits(this.dataset.sku);
                });

                // Append the button to the container
                buttonsContainer.appendChild(button);
            });

            // Make sure the bits buttons container is visible
            document.getElementById('top-left-menu').classList.add('visible');
        }).catch(function (error) {
            console.error('Error fetching Bits products:', error);
        });
        runGameJam(auth);
    });

    window.Twitch.ext.bits.onTransactionComplete(function (transactionObject) {
        console.log("we just completed the transaction")
        // console.log(transactionObject);
        userId = JSON.parse(atob(transactionObject['transactionReceipt'].split('.')[1]))['data']['userId']
        console.log(userId);
        const data = {
            r: getRandomColor(),
            g: getRandomColor(),
            b: getRandomColor(),
        };
        console.log("new color data:", data);
        const tWindows = document.getElementsByClassName("draggableWindow");
        for (let i = 0; i < tWindows.length; i++) {
            tWindows[i].style.setProperty("--r", data.r);
            tWindows[i].style.setProperty("--g", data.g);
            tWindows[i].style.setProperty("--b", data.b);
        }
    });

    function getRandomColor() {
        return Math.floor(Math.random() * 255);
    }
}