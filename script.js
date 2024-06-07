let parkedCars = []; // Array to store parked car details

function parkCar() {
    const numberPlateFile = document.getElementById('numberPlateFile').files[0];
    if (!numberPlateFile) {
        alert('Please upload a file with the number plate.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        if (numberPlateFile.type === 'text/plain') {
            const parkedNumberPlate = e.target.result.trim();
            processParking(parkedNumberPlate);
        } else {
            Tesseract.recognize(e.target.result, 'eng', {
                logger: m => console.log(m)
            }).then(({ data: { text } }) => {
                const parkedNumberPlate = text.trim();
                processParking(parkedNumberPlate);
            }).catch(err => {
                console.error("Error with OCR: " + err);
                alert('Error reading number plate from image. Please ensure the image is clear and try again.');
            });
        }
    };
    if (numberPlateFile.type === 'text/plain') {
        reader.readAsText(numberPlateFile);
    } else {
        reader.readAsDataURL(numberPlateFile);
    }
}

function processParking(parkedNumberPlate) {
    const startTime = new Date().getTime();
    parkedCars.push({ numberPlate: parkedNumberPlate, startTime: startTime });

    document.getElementById('message').innerHTML = `Car with number plate ${parkedNumberPlate} parked.`;
    document.getElementById('message').innerHTML += `<br>Total parked cars: ${parkedCars.length}`;

    setTimeout(() => {
        document.getElementById('message').innerHTML += `<br>1 minute has passed. You can now leave and calculate the bill for the car with number plate ${parkedNumberPlate}.`;
    }, 60000);  // 60000 milliseconds = 1 minute
}

function leaveCar() {
    const leaveNumberPlateFile = document.getElementById('leaveNumberPlateFile').files[0];
    if (!leaveNumberPlateFile) {
        alert('Please upload a file with the number plate.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        if (leaveNumberPlateFile.type === 'text/plain') {
            const leaveNumberPlate = e.target.result.trim();
            processLeaving(leaveNumberPlate);
        } else {
            Tesseract.recognize(e.target.result, 'eng', {
                logger: m => console.log(m)
            }).then(({ data: { text } }) => {
                const leaveNumberPlate = text.trim();
                processLeaving(leaveNumberPlate);
            }).catch(err => {
                console.error("Error with OCR: " + err);
                alert('Error reading number plate from image. Please ensure the image is clear and try again.');
            });
        }
    };
    if (leaveNumberPlateFile.type === 'text/plain') {
        reader.readAsText(leaveNumberPlateFile);
    } else {
        reader.readAsDataURL(leaveNumberPlateFile);
    }
}

function processLeaving(leaveNumberPlate) {
    const carIndex = parkedCars.findIndex(car => car.numberPlate === leaveNumberPlate);
    if (carIndex === -1) {
        alert('Number plate does not match any parked car.');
        return;
    }

    const parkedCar = parkedCars[carIndex];
    const endTime = new Date().getTime();
    const duration = (endTime - parkedCar.startTime) / 1000; // duration in seconds
    const billAmount = calculateBill(duration);

    document.getElementById('message').innerHTML = `Car with number plate ${leaveNumberPlate} left. Parking duration: ${duration} seconds.`;
    document.getElementById('billDetails').innerHTML = `
        <div class="bill-item"><p>Car number:</p><p>${leaveNumberPlate}</p></div>
        <div class="bill-item"><p>Duration:</p><p>${duration} seconds</p></div>
        <div class="bill-total">Bill Amount: ₹${billAmount.toFixed(2)}</div>
    `;
    document.getElementById('bill').style.display = 'block';

    // Update the printable bill
    document.getElementById('printableBill').innerHTML = `
        <div id="printableBill">
            <h2>Parking Bill</h2>
            <div class="bill-item"><p>Car number:</p><p>${leaveNumberPlate}</p></div>
            <div class="bill-item"><p>Duration:</p><p>${duration} seconds</p></div>
            <div class="bill-total">Bill Amount: ₹${billAmount.toFixed(2)}</div>
            <img src="fake-qr-code.png" alt="QR Code for Payment" class="qr-code">
            <p>Scan the QR code to pay</p>
        </div>
    `;

    parkedCars.splice(carIndex, 1); // Remove the car from the parked cars array
}

function calculateBill(duration) {
    const ratePerMinute = 0.05; // Example rate
    return duration / 60 * ratePerMinute; // Calculate bill based on duration
}

function downloadBill() {
    const element = document.createElement('a');
    const billContent = document.getElementById('printableBill').innerHTML;
    const file = new Blob([billContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = 'ParkingBill.html';
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
}

function printBill() {
    const printContents = document.getElementById('printableBill').innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Reload to restore original content
}

function startQrScanner() {
    const html5QrCode = new Html5Qrcode("qr-reader");
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        document.getElementById('qr-reader-results').innerHTML = `
            <strong>Payment Successful!</strong><br>
            Decoded Text: ${decodedText}
        `;
        html5QrCode.stop().then(ignore => {
            // QR Code scanning stopped.
        }).catch(err => {
            console.error("Failed to stop QR code scanner.");
        });
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            console.error("Unable to start QR code scanner.", err);
        });
}
