/**
 * Complex Number implementation for Quantum State Vector and Unitary Matrix operations.
 */
export class Complex {
  readonly re: number;
  readonly im: number;

  constructor(re: number = 0, im: number = 0) {
    this.re = re;
    this.im = im;
  }

  static readonly ZERO = new Complex(0, 0);
  static readonly ONE = new Complex(1, 0);
  static readonly I = new Complex(0, 1);
  static readonly NEG_ONE = new Complex(-1, 0);
  static readonly NEG_I = new Complex(0, -1);

  static fromPolar(r: number, theta: number): Complex {
    return new Complex(r * Math.cos(theta), r * Math.sin(theta));
  }

  add(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.re + other, this.im);
    }
    return new Complex(this.re + other.re, this.im + other.im);
  }

  sub(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.re - other, this.im);
    }
    return new Complex(this.re - other.re, this.im - other.im);
  }

  mul(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.re * other, this.im * other);
    }
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }

  div(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.re / other, this.im / other);
    }
    const denom = other.re * other.re + other.im * other.im;
    if (denom === 0) {
      throw new Error('Division by zero in Complex arithmetic');
    }
    return new Complex(
      (this.re * other.re + this.im * other.im) / denom,
      (this.im * other.re - this.re * other.im) / denom
    );
  }

  conjugate(): Complex {
    return new Complex(this.re, -this.im);
  }

  magnitudeSquared(): number {
    return this.re * this.re + this.im * this.im;
  }

  magnitude(): number {
    return Math.sqrt(this.magnitudeSquared());
  }

  phase(): number {
    return Math.atan2(this.im, this.re);
  }

  exp(): Complex {
    const r = Math.exp(this.re);
    return new Complex(r * Math.cos(this.im), r * Math.sin(this.im));
  }

  isCloseTo(other: Complex, tolerance: number = 1e-6): boolean {
    return (
      Math.abs(this.re - other.re) <= tolerance &&
      Math.abs(this.im - other.im) <= tolerance
    );
  }

  format(decimals: number = 3): string {
    const r = Math.abs(this.re) < 1e-9 ? 0 : this.re;
    const i = Math.abs(this.im) < 1e-9 ? 0 : this.im;

    if (i === 0) return r.toFixed(decimals);
    if (r === 0) {
      if (Math.abs(i - 1) < 1e-9) return 'i';
      if (Math.abs(i + 1) < 1e-9) return '-i';
      return `${i.toFixed(decimals)}i`;
    }

    const sign = i > 0 ? '+' : '-';
    const absI = Math.abs(i);
    const iStr = Math.abs(absI - 1) < 1e-9 ? 'i' : `${absI.toFixed(decimals)}i`;
    return `${r.toFixed(decimals)} ${sign} ${iStr}`;
  }
}
