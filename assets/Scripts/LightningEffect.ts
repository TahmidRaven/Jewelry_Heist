import { _decorator, Component, Graphics, Vec3, Color, isValid, v3 } from 'cc';
const { ccclass } = _decorator;

@ccclass('LightningEffect')
export class LightningEffect extends Component {
    private graphics: Graphics = null;
    private _activeBolts: { start: Vec3, end: Vec3, colorHex: string }[] = [];
    private _isDrawing: boolean = false;
    private _timer: number = 0;

    onLoad() {
        this.graphics = this.getComponent(Graphics) || this.addComponent(Graphics);
    }

    public clearWeb() {
        this._activeBolts = [];
        this._isDrawing = false;
        if (this.graphics && isValid(this.graphics)) {
            this.graphics.clear();
        }
    }

    public drawLightning(start: Vec3, end: Vec3, colorHex: string = "#82CAFF") {
        if (!this.graphics) return;
        this._activeBolts.push({ start, end, colorHex });
        this._isDrawing = true;
    }

    protected update(dt: number) {
        if (!this._isDrawing || this._activeBolts.length === 0) return;

        this._timer += dt * 30; // Faster multiplier for the electric "hum"
        this.graphics.clear();

        for (const bolt of this._activeBolts) {
            // Pulse logic: makes the glow breathe like real energy
            const pulse = Math.sin(this._timer) * 6; 
            this.renderGlowLayers(bolt.start, bolt.end, bolt.colorHex, pulse);
        }
    }

    private renderGlowLayers(start: Vec3, end: Vec3, colorHex: string, pulse: number) {
        const segments = 8;
        const offset = 22;
        const baseColor = new Color().fromHEX(colorHex);
        const whiteColor = Color.WHITE;

        // 1. ULTRA OUTER GLOW (Reacts to pulse)
        this.drawLayer(start, end, segments, offset, 70 + pulse, 20, baseColor); 

        // 2. MAIN HALO
        this.drawLayer(start, end, segments, offset, 35 + (pulse * 0.5), 75, baseColor);

        // 3. HOT CORE GLOW --> changed to white from base color  [RUBENS BHAI said so]
        this.drawLayer(start, end, segments, offset, 15, 170, whiteColor);

        // 4. THE WHITE BOLT (Sharp and steady)
        this.drawLayer(start, end, segments, offset, 4, 255, Color.WHITE);
    }

    private drawLayer(start: Vec3, end: Vec3, segments: number, offset: number, width: number, alpha: number, color: Color) {
        const drawColor = color.clone();
        drawColor.a = alpha;
        this.graphics.strokeColor = drawColor;
        this.graphics.lineWidth = width;
        this.renderPath(start, end, segments, offset);
    }

    private renderPath(start: Vec3, end: Vec3, segments: number, offset: number, isBranch: boolean = false) {
        this.graphics.moveTo(start.x, start.y);

        for (let i = 1; i <= segments; i++) {
            let targetPos = new Vec3();
            Vec3.lerp(targetPos, start, end, i / segments);

            if (i < segments) {
                targetPos.x += (Math.random() - 0.5) * offset * 2;
                targetPos.y += (Math.random() - 0.5) * offset * 2;
            }

            this.graphics.lineTo(targetPos.x, targetPos.y);

            // RANDOM BRANCHING: 8% chance to spawn a fork at each segment
            if (!isBranch && Math.random() > 0.92 && i < segments) {
                const branchEnd = v3(
                    targetPos.x + (Math.random() - 0.5) * 110,
                    targetPos.y + (Math.random() - 0.5) * 110,
                    0
                );
                // Branches are thinner and shorter
                const currentWidth = this.graphics.lineWidth;
                this.graphics.lineWidth *= 0.6;
                this.renderPath(targetPos, branchEnd, 3, offset * 0.5, true);
                this.graphics.lineWidth = currentWidth;
                this.graphics.moveTo(targetPos.x, targetPos.y);
            }
        }
        this.graphics.stroke();
    }
}