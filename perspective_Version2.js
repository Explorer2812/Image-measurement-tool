class PerspectiveTransform {
    static transformImage(sourceCanvas, corners, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const H = this.findHomography(corners, width, height);
        const H_inv = this.invertMatrix(H);

        const sourceCtx = sourceCanvas.getContext('2d');
        const sourceImageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const sourceData = sourceImageData.data;

        const outputImageData = ctx.createImageData(width, height);
        const outputData = outputImageData.data;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const [srcX, srcY] = this.applyHomography(H_inv, x, y);

                const pixel = this.bilinearInterpolate(
                    sourceData,
                    srcX,
                    srcY,
                    sourceCanvas.width,
                    sourceCanvas.height
                );

                const idx = (y * width + x) * 4;
                outputData[idx] = pixel.r;
                outputData[idx + 1] = pixel.g;
                outputData[idx + 2] = pixel.b;
                outputData[idx + 3] = pixel.a;
            }
        }

        ctx.putImageData(outputImageData, 0, 0);
        return canvas;
    }

    static findHomography(corners, width, height) {
        const destCorners = [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height }
        ];

        const A = [];
        const b = [];

        for (let i = 0; i < 4; i++) {
            const src = corners[i];
            const dest = destCorners[i];

            A.push([src.x, src.y, 1, 0, 0, 0, -dest.x * src.x, -dest.x * src.y]);
            b.push(dest.x);

            A.push([0, 0, 0, src.x, src.y, 1, -dest.y * src.x, -dest.y * src.y]);
            b.push(dest.y);
        }

        A.push([0, 0, 0, 0, 0, 0, 0, 1]);
        b.push(1);

        const h = this.gaussianElimination(A, b);

        return [
            [h[0], h[1], h[2]],
            [h[3], h[4], h[5]],
            [h[6], h[7], h[8]]
        ];
    }

    static applyHomography(H, x, y) {
        const [row0, row1, row2] = H;

        const srcX = (row0[0] * x + row0[1] * y + row0[2]) /
                     (row2[0] * x + row2[1] * y + row2[2]);
        const srcY = (row1[0] * x + row1[1] * y + row1[2]) /
                     (row2[0] * x + row2[1] * y + row2[2]);

        return [srcX, srcY];
    }

    static bilinearInterpolate(data, x, y, width, height) {
        x = Math.max(0, Math.min(x, width - 1));
        y = Math.max(0, Math.min(y, height - 1));

        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = Math.min(x0 + 1, width - 1);
        const y1 = Math.min(y0 + 1, height - 1);

        const fx = x - x0;
        const fy = y - y0;

        const getPixel = (px, py) => {
            const idx = (py * width + px) * 4;
            return {
                r: data[idx],
                g: data[idx + 1],
                b: data[idx + 2],
                a: data[idx + 3]
            };
        };

        const p00 = getPixel(x0, y0);
        const p10 = getPixel(x1, y0);
        const p01 = getPixel(x0, y1);
        const p11 = getPixel(x1, y1);

        return {
            r: Math.round(p00.r * (1-fx) * (1-fy) + p10.r * fx * (1-fy) + p01.r * (1-fx) * fy + p11.r * fx * fy),
            g: Math.round(p00.g * (1-fx) * (1-fy) + p10.g * fx * (1-fy) + p01.g * (1-fx) * fy + p11.g * fx * fy),
            b: Math.round(p00.b * (1-fx) * (1-fy) + p10.b * fx * (1-fy) + p01.b * (1-fx) * fy + p11.b * fx * fy),
            a: Math.round(p00.a * (1-fx) * (1-fy) + p10.a * fx * (1-fy) + p01.a * (1-fx) * fy + p11.a * fx * fy)
        };
    }

    static gaussianElimination(A, b) {
        const n = A.length;
        const augmented = A.map((row, i) => [...row, b[i]]);

        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = k;
                }
            }

            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

            for (let k = i + 1; k < n; k++) {
                const c = augmented[k][i] / augmented[i][i];
                for (let j = i; j <= n; j++) {
                    augmented[k][j] -= c * augmented[i][j];
                }
            }
        }

        const solution = new Array(n);
        for (let i = n - 1; i >= 0; i--) {
            solution[i] = augmented[i][n];
            for (let j = i + 1; j < n; j++) {
                solution[i] -= augmented[i][j] * solution[j];
            }
            solution[i] /= augmented[i][i];
        }

        return solution;
    }

    static invertMatrix(M) {
        const [[a, b, c], [d, e, f], [g, h, i]] = M;
        const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

        return [
            [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
            [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
            [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det]
        ];
    }
}