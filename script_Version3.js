class ImageMeasurementTool {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.image = null;
        this.displayImage = null;
        
        this.perspectiveMode = false;
        this.perspectiveCorners = [];
        this.perspectiveTransformed = false;
        this.perspectiveWidth = 0;
        this.perspectiveHeight = 0;
        
        this.calibrationMode = false;
        this.calibrationPoints = [];
        this.calibrationLength = 0;
        this.calibrationUnit = 'cm';
        this.pixelsPerUnit = null;
        
        this.measurementMode = false;
        this.measurements = [];
        this.currentMeasure = null;
        
        this.initializeEventListeners();
        this.updateUIState();
    }

    initializeEventListeners() {
        document.getElementById('imageUpload').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('perspectiveMode').addEventListener('change', (e) => this.togglePerspectiveMode(e));
        document.getElementById('perspectiveWidth').addEventListener('input', () => this.updatePerspectiveButton());
        document.getElementById('perspectiveHeight').addEventListener('input', () => this.updatePerspectiveButton());
        document.getElementById('perspectiveBtn').addEventListener('click', () => this.startPerspectiveCorrection());
        document.getElementById('removePerspectiveBtn').addEventListener('click', () => this.removePerspectiveCorrection());
        document.getElementById('calibrationMode').addEventListener('change', (e) => this.toggleCalibrationMode(e));
        document.getElementById('referenceLength').addEventListener('input', () => this.updateCalibrationButton());
        document.getElementById('calibrateBtn').addEventListener('click', () => this.startCalibration());
        document.getElementById('startMeasureBtn').addEventListener('click', () => this.toggleMeasurementMode());
        document.getElementById('clearMeasureBtn').addEventListener('click', () => this.clearLastMeasurement());
        document.getElementById('resetAllBtn').addEventListener('click', () => this.resetAll());
        document.getElementById('measurementUnit').addEventListener('change', () => this.redrawCanvas());
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.displayImage = img;
                this.perspectiveCorners = [];
                this.perspectiveTransformed = false;
                this.resizeCanvasToImage();
                this.redrawCanvas();
                this.showCanvasWrapper();
                this.updateUIState();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    resizeCanvasToImage() {
        this.canvas.width = this.displayImage.width;
        this.canvas.height = this.displayImage.height;
    }

    showCanvasWrapper() {
        document.getElementById('canvasWrapper').classList.remove('hidden');
        document.getElementById('noImagePlaceholder').classList.add('hidden');
    }

    togglePerspectiveMode(event) {
        this.perspectiveMode = event.target.checked;
        const inputs = document.getElementById('perspectiveInputs');
        
        if (this.perspectiveMode) {
            inputs.classList.remove('hidden');
            this.measurementMode = false;
            this.calibrationMode = false;
            document.getElementById('calibrationMode').checked = false;
            document.getElementById('calibrationInputs').classList.add('hidden');
        } else {
            inputs.classList.add('hidden');
            this.perspectiveCorners = [];
        }
        
        this.updatePerspectiveButton();
        this.updateUIState();
        this.redrawCanvas();
    }

    updatePerspectiveButton() {
        const btn = document.getElementById('perspectiveBtn');
        const width = document.getElementById('perspectiveWidth').value;
        const height = document.getElementById('perspectiveHeight').value;
        btn.disabled = !width || !height || this.perspectiveCorners.length > 0;
        
        if (this.perspectiveCorners.length > 0) {
            btn.textContent = `Set Perspective (${this.perspectiveCorners.length}/4 points)`;
        } else {
            btn.textContent = 'Set Perspective (Click 4 Points)';
        }
    }

    startPerspectiveCorrection() {
        this.perspectiveCorners = [];
        this.perspectiveWidth = parseInt(document.getElementById('perspectiveWidth').value);
        this.perspectiveHeight = parseInt(document.getElementById('perspectiveHeight').value);
        const status = document.getElementById('perspectiveStatus');
        status.className = 'status info';
        status.textContent = 'Click on the 4 corners...';
        this.updatePerspectiveButton();
        this.redrawCanvas();
    }

    removePerspectiveCorrection() {
        this.perspectiveCorners = [];
        this.perspectiveTransformed = false;
        this.displayImage = this.image;
        this.resizeCanvasToImage();
        this.redrawCanvas();
        
        document.getElementById('removePerspectiveBtn').classList.add('hidden');
        const status = document.getElementById('perspectiveStatus');
        status.className = 'status info';
        status.textContent = 'Perspective correction removed';
        
        this.updateUIState();
    }

    toggleCalibrationMode(event) {
        this.calibrationMode = event.target.checked;
        const inputs = document.getElementById('calibrationInputs');
        
        if (this.calibrationMode) {
            inputs.classList.remove('hidden');
            this.measurementMode = false;
        } else {
            inputs.classList.add('hidden');
            this.calibrationPoints = [];
        }
        
        this.updateCalibrationButton();
        this.updateUIState();
        this.redrawCanvas();
    }

    updateCalibrationButton() {
        const btn = document.getElementById('calibrateBtn');
        const length = document.getElementById('referenceLength').value;
        btn.disabled = !length || this.calibrationPoints.length > 0;
        
        if (this.calibrationPoints.length > 0) {
            btn.textContent = `Calibrate (${this.calibrationPoints.length}/2 points)`;
        } else {
            btn.textContent = 'Calibrate (Click 2 Points)';
        }
    }

    startCalibration() {
        this.calibrationPoints = [];
        this.calibrationLength = parseFloat(document.getElementById('referenceLength').value);
        const status = document.getElementById('calibrationStatus');
        status.className = 'status info';
        status.textContent = 'Click on two points defining your reference object...';
        this.updateCalibrationButton();
        this.redrawCanvas();
    }

    toggleMeasurementMode() {
        if (!this.image) return;
        
        this.measurementMode = !this.measurementMode;
        this.calibrationMode = false;
        document.getElementById('calibrationMode').checked = false;
        document.getElementById('calibrationInputs').classList.add('hidden');
        
        const btn = document.getElementById('startMeasureBtn');
        if (this.measurementMode) {
            btn.textContent = 'Stop Measurement';
            btn.style.background = '#dc3545';
            this.currentMeasure = [];
        } else {
            btn.textContent = 'Start Measurement';
            btn.style.background = '';
            this.currentMeasure = null;
        }
        
        this.updateUIState();
        this.redrawCanvas();
    }

    handleCanvasClick(event) {
        if (!this.image) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const canvasX = x * scaleX;
        const canvasY = y * scaleY;

        if (this.perspectiveMode && this.perspectiveCorners.length < 4) {
            this.perspectiveCorners.push({ x: canvasX, y: canvasY });
            
            if (this.perspectiveCorners.length === 4) {
                this.completePerspectiveTransform();
            }
            
            this.updatePerspectiveButton();
            this.redrawCanvas();
        } else if (this.calibrationMode && this.calibrationPoints.length < 2) {
            this.calibrationPoints.push({ x: canvasX, y: canvasY });
            
            if (this.calibrationPoints.length === 2) {
                this.completeCalibration();
            }
            
            this.updateCalibrationButton();
            this.redrawCanvas();
        } else if (this.measurementMode) {
            this.currentMeasure.push({ x: canvasX, y: canvasY });
            
            if (this.currentMeasure.length === 2) {
                this.completeMeasurement();
            }
            
            this.redrawCanvas();
        }
    }

    handleCanvasMouseMove(event) {
        if (!this.image) {
            this.hideTooltip();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const tooltip = document.getElementById('tooltip');
        
        tooltip.style.left = (event.clientX - rect.left + 10) + 'px';\n        tooltip.style.top = (event.clientY - rect.top + 10) + 'px';

        let text = '';
        if (this.perspectiveMode && this.perspectiveCorners.length < 4) {
            const corners = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
            text = `Click ${corners[this.perspectiveCorners.length]} corner`;
        } else if (this.calibrationMode && this.calibrationPoints.length < 2) {
            text = this.calibrationPoints.length === 0 ? 'Click first point' : 'Click second point';
        } else if (this.measurementMode) {
            text = this.currentMeasure.length === 0 ? 'Click first point' : 'Click second point';
        }

        if (text) {
            tooltip.textContent = text;
            tooltip.classList.remove('hidden');
        } else {
            this.hideTooltip();
        }
    }

    hideTooltip() {
        document.getElementById('tooltip').classList.add('hidden');
    }

    completePerspectiveTransform() {
        try {
            const transformedCanvas = PerspectiveTransform.transformImage(
                this.canvas,
                this.perspectiveCorners,
                this.perspectiveWidth,
                this.perspectiveHeight
            );

            const img = new Image();
            img.onload = () => {
                this.displayImage = img;
                this.perspectiveTransformed = true;
                this.resizeCanvasToImage();
                this.redrawCanvas();
                
                const status = document.getElementById('perspectiveStatus');
                status.className = 'status success';
                status.textContent = '✓ Perspective correction applied';
                
                document.getElementById('removePerspectiveBtn').classList.remove('hidden');
                document.getElementById('perspectiveMode').checked = false;
                this.perspectiveMode = false;
                document.getElementById('perspectiveInputs').classList.add('hidden');
                
                this.updateUIState();
            };
            img.src = transformedCanvas.toDataURL();
        } catch (error) {
            const status = document.getElementById('perspectiveStatus');
            status.className = 'status error';
            status.textContent = '✗ Error applying perspective correction';
            console.error('Perspective error:', error);
        }
    }

    completeCalibration() {
        const p1 = this.calibrationPoints[0];
        const p2 = this.calibrationPoints[1];
        const pixelDistance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        
        this.pixelsPerUnit = pixelDistance / this.calibrationLength;
        
        const status = document.getElementById('calibrationStatus');
        status.className = 'status success';
        status.textContent = `✓ Calibrated: ${this.calibrationLength} ${this.calibrationUnit} = ${pixelDistance.toFixed(2)} pixels`;
        
        document.getElementById('calibrationMode').checked = false;
        this.calibrationMode = false;
        document.getElementById('calibrationInputs').classList.add('hidden');
        document.getElementById('measurementUnit').value = this.calibrationUnit;
        this.updateUIState();
    }

    completeMeasurement() {
        const p1 = this.currentMeasure[0];
        const p2 = this.currentMeasure[1];
        const pixelDistance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        
        const unit = document.getElementById('measurementUnit').value;
        let displayValue = pixelDistance;
        let displayUnit = 'pixels';

        if (unit !== 'pixels' && this.pixelsPerUnit) {
            displayValue = pixelDistance / this.pixelsPerUnit;
            displayUnit = unit;
        }

        this.measurements.push({
            id: Date.now(),
            pixelDistance: pixelDistance,
            displayValue: displayValue,
            unit: displayUnit,
            points: this.currentMeasure
        });

        this.currentMeasure = [];
        this.updateMeasurementsList();
        this.redrawCanvas();
    }

    clearLastMeasurement() {
        if (this.measurements.length > 0) {
            this.measurements.pop();
            this.updateMeasurementsList();
            this.redrawCanvas();
        }
    }

    resetAll() {
        if (confirm('Reset all measurements, calibration, and perspective corrections?')) {
            this.perspectiveCorners = [];
            this.perspectiveTransformed = false;
            this.calibrationPoints = [];
            this.calibrationLength = 0;
            this.pixelsPerUnit = null;
            this.measurements = [];
            this.currentMeasure = null;
            this.calibrationMode = false;
            this.measurementMode = false;
            this.perspectiveMode = false;
            
            this.displayImage = this.image;
            this.resizeCanvasToImage();
            
            document.getElementById('perspectiveMode').checked = false;
            document.getElementById('perspectiveInputs').classList.add('hidden');
            document.getElementById('perspectiveStatus').textContent = '';
            document.getElementById('removePerspectiveBtn').classList.add('hidden');
            document.getElementById('calibrationMode').checked = false;
            document.getElementById('calibrationInputs').classList.add('hidden');
            document.getElementById('calibrationStatus').textContent = '';
            document.getElementById('startMeasureBtn').textContent = 'Start Measurement';
            document.getElementById('startMeasureBtn').style.background = '';
            
            this.updateMeasurementsList();
            this.updateUIState();
            this.redrawCanvas();
        }
    }

    updateMeasurementsList() {
        const list = document.getElementById('measurementsList');
        
        if (this.measurements.length === 0) {
            list.innerHTML = '<p class="placeholder">No measurements yet</p>';
            return;
        }

        list.innerHTML = this.measurements.map((m, idx) => `
            <div class="measurement-item">
                <strong>Measurement ${idx + 1}:</strong> 
                <span class="value">${m.displayValue.toFixed(2)} ${m.unit}</span>
            </div>
        `).join('');
    }

    redrawCanvas() {
        if (!this.displayImage) return;

        this.ctx.drawImage(this.displayImage, 0, 0);

        if (this.perspectiveCorners.length > 0) {
            this.drawPoints(this.perspectiveCorners, '#FF9800', 'Perspective');
            if (this.perspectiveCorners.length > 1) {
                for (let i = 0; i < this.perspectiveCorners.length - 1; i++) {
                    this.drawLine(this.perspectiveCorners[i], this.perspectiveCorners[i + 1], '#FF9800', 2);
                }
                this.drawLine(this.perspectiveCorners[this.perspectiveCorners.length - 1], this.perspectiveCorners[0], '#FF9800', 2);
            }
        }

        if (this.calibrationPoints.length > 0) {
            this.drawPoints(this.calibrationPoints, '#FF6B6B', 'Calibration');
            if (this.calibrationPoints.length === 2) {
                this.drawLine(this.calibrationPoints[0], this.calibrationPoints[1], '#FF6B6B', 2);
            }
        }

        this.measurements.forEach((m, idx) => {
            this.drawPoints(m.points, '#667eea', `Measure ${idx + 1}`);\n            this.drawLine(m.points[0], m.points[1], '#667eea', 3);\n            this.drawMeasurementLabel(m.points, m.displayValue, m.unit, '#667eea');\n        });\n\n        if (this.currentMeasure && this.currentMeasure.length > 0) {\n            this.drawPoints(this.currentMeasure, '#4CAF50', 'Current');\n            if (this.currentMeasure.length === 2) {\n                this.drawLine(this.currentMeasure[0], this.currentMeasure[1], '#4CAF50', 2);\n            }\n        }\n    }\n\n    drawPoints(points, color, label) {\n        points.forEach((p, idx) => {\n            this.ctx.fillStyle = color;\n            this.ctx.beginPath();\n            this.ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);\n            this.ctx.fill();\n            \n            this.ctx.strokeStyle = 'white';\n            this.ctx.lineWidth = 2;\n            this.ctx.stroke();\n        });\n    }\n\n    drawLine(p1, p2, color, width) {\n        this.ctx.strokeStyle = color;\n        this.ctx.lineWidth = width;\n        this.ctx.beginPath();\n        this.ctx.moveTo(p1.x, p1.y);\n        this.ctx.lineTo(p2.x, p2.y);\n        this.ctx.stroke();\n    }\n\n    drawMeasurementLabel(points, value, unit, color) {\n        const midX = (points[0].x + points[1].x) / 2;\n        const midY = (points[0].y + points[1].y) / 2;\n\n        const text = `${value.toFixed(2)} ${unit}`;\n        this.ctx.fillStyle = color;\n        this.ctx.font = 'bold 14px Arial';\n        this.ctx.fillText(text, midX + 10, midY - 10);\n    }\n\n    updateUIState() {\n        const imageLoaded = this.image !== null;\n\n        document.getElementById('startMeasureBtn').disabled = !imageLoaded;\n        document.getElementById('clearMeasureBtn').disabled = this.measurements.length === 0;\n        document.getElementById('resetAllBtn').disabled = \n            this.measurements.length === 0 && this.calibrationPoints.length === 0 && this.perspectiveCorners.length === 0;\n        document.getElementById('measurementUnit').disabled = !imageLoaded;\n    }\n}\n\ndocument.addEventListener('DOMContentLoaded', () => {\n    new ImageMeasurementTool();\n});