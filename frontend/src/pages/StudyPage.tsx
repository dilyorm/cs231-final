import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronRight, ChevronDown, Star, AlertTriangle } from "lucide-react";

type Block =
  | { t: "p"; c: string }
  | { t: "code"; c: string; label?: string }
  | { t: "dia"; c: string; label?: string }
  | { t: "table"; h: string[]; r: string[][] }
  | { t: "list"; items: string[] }
  | { t: "warn"; items: string[] };

interface Section { heading: string; icon: string; color: string; blocks: Block[] }
interface Topic { number: number; short: string; title: string; overview: string; sections: Section[] }

const C = {
  indigo: { card: "bg-indigo-950/30 border-indigo-500/20", badge: "text-indigo-300", ch: "text-indigo-500", dot: "bg-indigo-400" },
  violet: { card: "bg-violet-950/30 border-violet-500/20", badge: "text-violet-300", ch: "text-violet-500", dot: "bg-violet-400" },
  amber:  { card: "bg-amber-950/30  border-amber-500/20",  badge: "text-amber-300",  ch: "text-amber-500",  dot: "bg-amber-400"  },
  red:    { card: "bg-red-950/30    border-red-500/20",    badge: "text-red-300",    ch: "text-red-500",    dot: "bg-red-400"    },
};

function Block({ b, dot }: { b: Block; dot: string }) {
  if (b.t === "p") return <p className="text-slate-300 text-sm leading-relaxed mb-2">{b.c}</p>;
  if (b.t === "list") return (
    <ul className="space-y-1.5 mb-2">
      {b.items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[7px] ${dot}`} />
          <span className="text-slate-300 text-sm leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
  if (b.t === "code") return (
    <div className="mb-3">
      {b.label && <div className="text-xs text-slate-500 mb-1 font-mono">{b.label}</div>}
      <pre className="bg-slate-900 border border-slate-700/60 rounded-lg p-3 text-xs text-amber-200 font-mono overflow-x-auto leading-relaxed whitespace-pre">{b.c}</pre>
    </div>
  );
  if (b.t === "dia") return (
    <div className="mb-3">
      {b.label && <div className="text-xs text-slate-500 mb-1">{b.label}</div>}
      <pre className="bg-slate-950 border border-emerald-900/40 rounded-lg p-3 text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed whitespace-pre">{b.c}</pre>
    </div>
  );
  if (b.t === "table") return (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>{b.h.map((h, i) => <th key={i} className="border border-slate-700 bg-slate-800 px-2 py-1.5 text-slate-300 text-left font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {b.r.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-slate-900/50" : "bg-slate-800/20"}>
              {row.map((cell, j) => <td key={j} className="border border-slate-700/40 px-2 py-1.5 text-slate-300 font-mono">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  if (b.t === "warn") return (
    <div className="mb-2 bg-red-950/40 border border-red-500/25 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        <span className="text-xs font-bold text-red-400">EXAM TRAPS</span>
      </div>
      <ul className="space-y-1.5">
        {b.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-red-500 text-xs flex-shrink-0 mt-0.5">→</span>
            <span className="text-red-200 text-xs leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
  return null;
}

const TOPICS: Topic[] = [
  // ─────────────────────────────────────────────────────────── TOPIC 1
  {
    number: 1, short: "Binary & Endianness",
    title: "Topic 1 – Binary Representation, Byte Memory & Byte Ordering",
    overview: "Every piece of data a computer handles — integers, floats, characters, instructions — is stored as binary digits. Understanding how numbers are represented in different bases and how multi-byte values are laid out in memory is the foundation for everything else in this course.",
    sections: [
      { heading: "Number Systems", icon: "🔢", color: "indigo", blocks: [
        { t: "p", c: "Computers use binary (base-2) internally because transistors have two stable states: on/off. We use hex (base-16) as a compact human-readable shorthand — every 4 bits maps exactly to one hex digit." },
        { t: "dia", label: "Bit positions in one byte:", c:
`Bit #:   7    6    5    4    3    2    1    0
Weight: 128   64   32   16    8    4    2    1

Example: 11101101₂
         1×128 + 1×64 + 1×32 + 0×16 + 1×8 + 1×4 + 0×2 + 1×1 = 237₁₀ = 0xED` },
        { t: "p", c: "Binary↔Hex conversion: group bits in 4 from the right. Each group of 4 bits becomes one hex digit." },
        { t: "dia", label: "Binary ↔ Hex:", c:
`1110  1101
 ↓       ↓
 E       D    →  0xED

Hex digits: 0-9, A=10, B=11, C=12, D=13, E=14, F=15` },
        { t: "table", h: ["Type", "Bits", "Hex digits", "Range"], r: [
          ["byte", "8", "2", "0–255"],
          ["word (x86)", "16", "4", "0–65535"],
          ["dword", "32", "8", "0–4294967295"],
          ["qword", "64", "16", "0–2⁶⁴-1"],
        ]},
      ]},
      { heading: "Byte-Oriented Memory", icon: "🧠", color: "violet", blocks: [
        { t: "p", c: "Memory is an array of bytes. Every byte has a unique address. The CPU generates byte addresses. A 32-bit CPU can address 2³² = 4 GB. A 64-bit CPU theoretically 2⁶⁴ bytes, but x86-64 uses only 48-bit addresses (256 TB) in practice." },
        { t: "table", h: ["Type", "Size", "x86-64 sizeof"], r: [
          ["char", "1 byte", "1"],
          ["short", "2 bytes", "2"],
          ["int", "4 bytes", "4"],
          ["long", "8 bytes (Linux 64-bit)", "8"],
          ["pointer (void*)", "word size", "8"],
          ["double", "8 bytes", "8"],
        ]},
      ]},
      { heading: "Byte Ordering (Endianness)", icon: "🔄", color: "amber", blocks: [
        { t: "p", c: "When a multi-byte value is stored in memory, which byte comes first? There are two conventions. x86 and x86-64 use little-endian. Network protocols use big-endian (called 'network byte order')." },
        { t: "dia", label: "Storing 0x12345678 at address 0x100:", c:
`Address:      0x100  0x101  0x102  0x103
              ┌──────┬──────┬──────┬──────┐
Big-endian:   │ 0x12 │ 0x34 │ 0x56 │ 0x78 │  MSB at lowest addr
              └──────┴──────┴──────┴──────┘
              ┌──────┬──────┬──────┬──────┐
Little-endian:│ 0x78 │ 0x56 │ 0x34 │ 0x12 │  LSB at lowest addr (x86!)
              └──────┴──────┴──────┴──────┘` },
        { t: "p", c: "To convert between host and network byte order, use htonl()/ntohl() for 32-bit integers, htons()/ntohs() for 16-bit. These are no-ops on big-endian hosts." },
        { t: "code", label: "Detect endianness at runtime:", c:
`union { uint32_t i; uint8_t c[4]; } u = { .i = 1 };
if (u.c[0] == 1) puts("little-endian");  // x86: true
else             puts("big-endian");` },
        { t: "warn", items: [
          "Little-endian: address 0x100 holds the LEAST significant byte. What you see in a hex dump is bytes in address order — looks 'reversed' vs the integer value.",
          "Single bytes are unaffected by endianness. String characters are NOT reordered.",
          "Writing to EAX zero-extends the upper 32 bits of RAX. Writing to AX does NOT touch upper bits.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 2
  {
    number: 2, short: "Integer Encoding",
    title: "Topic 2 – Encoding Integers & Integer Arithmetic",
    overview: "Unsigned integers are raw binary. Signed integers use two's complement — the universal standard. Overflow is silent and wraps modulo 2ⁿ. Division requires careful setup of RDX before IDIV.",
    sections: [
      { heading: "Unsigned & Two's Complement", icon: "🔢", color: "indigo", blocks: [
        { t: "p", c: "Two's complement is elegant: the same hardware adder works for both signed and unsigned arithmetic. The MSB has negative weight (-2^(n-1)), all others positive." },
        { t: "dia", label: "8-bit two's complement:", c:
`Bit pattern │ Unsigned │ Signed (two's complement)
────────────┼──────────┼──────────────────────────
0000 0000   │    0     │    0
0000 0001   │    1     │    1
0111 1111   │   127    │  127  ← max positive
1000 0000   │   128    │ -128  ← min (most negative!)
1111 1110   │   254    │   -2
1111 1111   │   255    │   -1  ← all ones = -1` },
        { t: "p", c: "Negation rule: flip all bits, then add 1. This works because x + ~x = 0xFFF...F = -1, so ~x = -x - 1, so -x = ~x + 1." },
        { t: "dia", label: "Negating 5:", c:
` 5  =  0000 0101
~5  =  1111 1010   (flip all bits)
-5  =  1111 1011   (add 1)

Check: 5 + (-5) = 0000 0101
                + 1111 1011
               = 1 0000 0000  → discard carry → 0000 0000 ✓` },
        { t: "p", c: "Sign extension: when widening a signed integer (e.g. int8→int32), copy the MSB (sign bit) into all new upper bits. Zero extension fills upper bits with 0 and is used for unsigned widening." },
      ]},
      { heading: "Arithmetic & Overflow", icon: "➕", color: "violet", blocks: [
        { t: "p", c: "Addition/subtraction is identical for unsigned and signed at the bit level — only interpretation differs. Overflow means the true result doesn't fit." },
        { t: "dia", label: "Overflow detection:", c:
`Unsigned overflow: carry out of MSB (CF flag set)
  200 + 100 = 300, but 300 > 255 → wraps to 44

Signed overflow: both operands same sign, result opposite (OF flag)
  127 + 1 = 128, but 128 > 127 → wraps to -128` },
        { t: "p", c: "Shifts are used for fast multiplication/division by powers of 2. Arithmetic right shift (SAR) preserves the sign bit for signed division. Logical right shift (SHR) fills with 0 for unsigned." },
        { t: "table", h: ["Operation", "Instruction", "Effect", "When to use"], r: [
          ["×2ᵏ", "SHL dst, k", "shift left, fill 0 (LSB)", "always"],
          ["÷2ᵏ (unsigned)", "SHR dst, k", "shift right, fill 0 (MSB)", "unsigned only"],
          ["÷2ᵏ (signed)", "SAR dst, k", "shift right, fill sign bit", "signed only"],
        ]},
        { t: "p", c: "For integer division, IDIV takes its dividend from RDX:RAX (128-bit). You must sign-extend RAX into RDX first using CDQ (32-bit) or CQO (64-bit)." },
        { t: "code", label: "64-bit signed division: RAX = RAX ÷ RBX", c:
`mov  rax, -100   ; dividend
cqo               ; sign-extend RAX → RDX:RAX (CQO required!)
mov  rbx, 7
idiv rbx          ; RAX = quotient (-14), RDX = remainder (-2)` },
        { t: "warn", items: [
          "INT_MIN negation overflows: -(-2147483648) = -2147483648 in 32-bit two's complement.",
          "Casting signed -1 to unsigned 32-bit = 4294967295 (0xFFFFFFFF). Bit pattern unchanged.",
          "IDIV without CDQ/CQO: RDX has garbage → wrong quotient or #DE exception.",
          "SAR rounds toward -∞, not 0. SAR of -9 by 1 = -5, but -9/2 in C = -4.",
          "INC and DEC do NOT modify CF. Use ADD 1 / SUB 1 if you need CF.",
        ]},
      ]},
      { heading: "Bit Manipulation", icon: "⚙️", color: "amber", blocks: [
        { t: "table", h: ["Goal", "Expression", "Note"], r: [
          ["Test bit k", "(x >> k) & 1", "or: x & (1<<k)"],
          ["Set bit k", "x | (1<<k)", ""],
          ["Clear bit k", "x & ~(1<<k)", ""],
          ["Toggle bit k", "x ^ (1<<k)", ""],
          ["Isolate lowest set bit", "x & (-x)", "x & ~x+1"],
          ["Clear lowest set bit", "x & (x-1)", "useful for popcount loops"],
          ["Zero register", "XOR eax,eax", "faster than MOV eax,0"],
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 3
  {
    number: 3, short: "Floating Point",
    title: "Topic 3 – IEEE 754 Floating Point & Rounding",
    overview: "IEEE 754 represents real numbers as sign × mantissa × 2^exponent. The exponent is biased (stored offset from a fixed bias). Special bit patterns encode ±0, ±∞, NaN, and denormals. Arithmetic is NOT associative.",
    sections: [
      { heading: "IEEE 754 Structure", icon: "🔬", color: "indigo", blocks: [
        { t: "dia", label: "float (32-bit):", c:
` 31  30        23 22                     0
 ┌───┬──────────┬───────────────────────┐
 │ S │ Exponent │       Mantissa        │
 │ 1b│  8 bits  │       23 bits         │
 └───┴──────────┴───────────────────────┘
        bias = 127

double (64-bit):
 63  62           52 51                  0
 ┌───┬─────────────┬────────────────────┐
 │ S │  Exponent   │      Mantissa      │
 │ 1b│   11 bits   │      52 bits       │
 └───┴─────────────┴────────────────────┘
          bias = 1023` },
        { t: "p", c: "Normalized numbers have an implicit leading 1 in the mantissa: M = 1.fraction. The actual value is: (-1)^S × 1.mantissa × 2^(exponent_bits - bias). This gives float precision of ~7 decimal digits, double ~15." },
        { t: "dia", label: "Encoding -6.5:", c:
`-6.5 = -1.101₂ × 2²

S = 1
Exponent: 2 + 127 = 129 = 1000_0001₂
Mantissa: 101_0000_0000_0000_0000_0000 (drop implicit 1.)

Result: 1 10000001 10100000000000000000000
Hex:    0xC0D00000` },
      ]},
      { heading: "Special Values & Denormals", icon: "∞", color: "violet", blocks: [
        { t: "table", h: ["Exp bits", "Mantissa", "Value", "Notes"], r: [
          ["00000000", "0", "±0", "+0 == -0, but 1/+0=+∞, 1/-0=-∞"],
          ["00000000", "≠0", "Denormal", "No implicit 1, E=-126 (float)"],
          ["11111111", "0", "±∞", "Overflow or div by zero"],
          ["11111111", "≠0", "NaN", "Invalid op. x!=x is true!"],
          ["1–254", "any", "Normal", "Implicit 1. Bias applied"],
        ]},
        { t: "p", c: "Denormals (subnormals) fill the gap near zero with gradually less precise numbers. They have exponent bits = 0 but the actual exponent E = -126 (not -127), and no implicit leading 1. Many CPUs run much slower on denormals — some flush them to zero (FTZ mode)." },
      ]},
      { heading: "Rounding & Arithmetic Pitfalls", icon: "🔄", color: "amber", blocks: [
        { t: "p", c: "IEEE 754 default rounding is round-to-even (banker's rounding): ties are broken by rounding to the nearest even mantissa. This minimizes cumulative bias in long computations." },
        { t: "dia", label: "Round-to-even examples:", c:
`2.5 → 2  (2 is even)
3.5 → 4  (4 is even)
4.5 → 4  (4 is even)
5.5 → 6  (6 is even)` },
        { t: "p", c: "Float arithmetic is NOT associative due to rounding at each step. This breaks many assumptions from real arithmetic." },
        { t: "code", label: "Classic pitfalls:", c:
`// Associativity failure
(1e30 + -1e30) + 1.0  =  0.0 + 1.0  =  1.0
 1e30 + (-1e30 + 1.0) =  1e30 + 1.0  =  1e30  ← catastrophic cancellation

// Equality failure
0.1 + 0.2 == 0.3  →  FALSE  (0.30000000000000004 ≠ 0.3)

// Correct float comparison:
fabs(a - b) < 1e-9` },
        { t: "warn", items: [
          "NaN != NaN is TRUE. The only reliable NaN check: isnan(x) or x != x.",
          "0.1 has no exact binary representation — it's a repeating binary fraction.",
          "int 16777217 (2²⁴+1) rounds to 16777216.0f — loses the low bit (only 23 mantissa bits).",
          "Denormals: exp_bits=0 but E=-126 for float (not -127). No implicit leading 1.",
          "Float overflow → ±∞ (not undefined behavior). Integer overflow → UB in C.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 4
  {
    number: 4, short: "x86/x64 Registers",
    title: "Topic 4 – Intel x86/x64 Processors & Register File",
    overview: "x86 (IA-32) provides 8 × 32-bit GPRs. x86-64 extends to 16 × 64-bit GPRs and makes the ABI cleaner. Each 64-bit register has 32/16/8-bit sub-registers. Writing the 32-bit form zero-extends the full 64-bit register.",
    sections: [
      { heading: "Register Hierarchy", icon: "📋", color: "indigo", blocks: [
        { t: "dia", label: "RAX register aliases:", c:
` 63                              0
 ┌─────────────────────────────────┐
 │              RAX               │  64-bit
 └─────────────────────────────────┘
                  ┌────────────────┐
                  │      EAX      │  32-bit (writing zeroes upper 32!)
                  └────────────────┘
                          ┌────────┐
                          │   AX  │  16-bit (writing does NOT touch upper)
                          └────────┘
                          ┌────┬───┐
                          │ AH │AL │  8-bit halves of AX
                          └────┴───┘` },
        { t: "table", h: ["64-bit", "32-bit", "16-bit", "8-bit high", "8-bit low", "Purpose"], r: [
          ["RAX", "EAX", "AX", "AH", "AL", "Return value / accumulator"],
          ["RBX", "EBX", "BX", "BH", "BL", "Callee-saved general"],
          ["RCX", "ECX", "CX", "CH", "CL", "4th arg / counter / shift count"],
          ["RDX", "EDX", "DX", "DH", "DL", "3rd arg / MUL-DIV high bits"],
          ["RSI", "ESI", "SI", "-", "SIL", "2nd arg / source index"],
          ["RDI", "EDI", "DI", "-", "DIL", "1st arg / dest index"],
          ["RBP", "EBP", "BP", "-", "BPL", "Stack frame base (callee-saved)"],
          ["RSP", "ESP", "SP", "-", "SPL", "Stack pointer"],
          ["R8–R15", "R8D–R15D", "R8W–R15W", "-", "R8B–R15B", "5th-6th args + general"],
        ]},
      ]},
      { heading: "RFLAGS & Condition Codes", icon: "🚦", color: "violet", blocks: [
        { t: "p", c: "RFLAGS is a 64-bit register where individual bits record properties of the last arithmetic result. Conditional jump instructions read these bits." },
        { t: "table", h: ["Flag", "Bit", "Set when", "Used by"], r: [
          ["CF", "0", "Unsigned overflow / borrow", "JB, JA (unsigned jumps)"],
          ["ZF", "6", "Result == 0", "JE, JNE"],
          ["SF", "7", "Result MSB = 1 (negative)", "JL, JG (signed jumps)"],
          ["OF", "11", "Signed overflow", "JL (SF≠OF), JG (SF=OF)"],
          ["PF", "2", "Even number of 1-bits in low byte", "Rare"],
        ]},
        { t: "p", c: "CMP a,b computes a−b and sets flags without storing the result. TEST a,b computes a AND b and sets flags without storing. Use TEST for checking if a register is zero." },
        { t: "code", c:
`cmp  rax, rbx    ; sets flags based on rax-rbx
je   equal        ; jump if ZF=1 (rax == rbx)

test rax, rax     ; sets ZF=1 if rax==0
jz   is_zero      ; jump if zero

test rax, 1       ; check LSB
jnz  is_odd` },
        { t: "warn", items: [
          "MOV EAX,1 silently zeros upper 32 bits of RAX. MOV AX,1 does NOT touch upper bits.",
          "INC/DEC preserve CF — they do not set it. Use ADD reg,1 if you need CF.",
          "RSP must be 16-byte aligned BEFORE the CALL instruction per System V ABI.",
          "NOT instruction does not set any flags. NEG does.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 5
  {
    number: 5, short: "Assembly & Arithmetic",
    title: "Topic 5 – Assembly Language & Arithmetic Operations",
    overview: "NASM uses Intel syntax: opcode dst, src (destination first). Each arithmetic instruction sets RFLAGS as a side effect. MUL/IMUL produce double-width results in RDX:RAX. Division requires explicit setup.",
    sections: [
      { heading: "NASM Syntax & Structure", icon: "📝", color: "indigo", blocks: [
        { t: "code", label: "Minimal NASM program (Linux):", c:
`section .data
    msg db "Hello", 10     ; string + newline
    len equ $ - msg        ; length constant

section .bss
    buf resb 64            ; reserve 64 uninitialized bytes

section .text
    global _start
_start:
    mov  rax, 1            ; syscall: write
    mov  rdi, 1            ; fd: stdout
    mov  rsi, msg          ; buffer address
    mov  rdx, len          ; length
    syscall
    mov  rax, 60           ; syscall: exit
    xor  rdi, rdi          ; exit code 0
    syscall` },
        { t: "p", c: "Intel syntax: destination always on the left. No % prefix on registers. No size suffix on mnemonics. Square brackets mean 'memory at this address': MOV rax,[rbx] reads 8 bytes from the address in rbx." },
      ]},
      { heading: "Arithmetic Instructions", icon: "➕", color: "violet", blocks: [
        { t: "table", h: ["Instruction", "Effect", "Flags set"], r: [
          ["ADD dst, src", "dst = dst + src", "CF ZF SF OF PF"],
          ["SUB dst, src", "dst = dst - src", "CF ZF SF OF PF"],
          ["INC dst", "dst++", "ZF SF OF PF (not CF!)"],
          ["DEC dst", "dst--", "ZF SF OF PF (not CF!)"],
          ["NEG dst", "dst = -dst (two's complement)", "CF ZF SF OF"],
          ["IMUL dst, src", "dst = dst × src (signed)", "CF OF"],
          ["IMUL dst, src, imm", "dst = src × imm (signed, no RDX)", "CF OF"],
          ["MUL src", "RDX:RAX = RAX × src (unsigned)", "CF OF"],
          ["IDIV src", "RAX=quotient, RDX=remainder (signed)", "undefined"],
          ["CDQ / CQO", "Sign-extend EAX→EDX:EAX / RAX→RDX:RAX", "none"],
        ]},
        { t: "code", label: "Division example — a/b and a%b:", c:
`; int64 a in rax, b in rbx
cqo           ; sign-extend rax into rdx:rax (MUST DO THIS)
idiv rbx      ; rax = a/b (quotient), rdx = a%b (remainder)` },
      ]},
      { heading: "Logical & Shift", icon: "⚙️", color: "amber", blocks: [
        { t: "code", c:
`; Logical operations
and  rax, 0xFF      ; mask: keep only low byte
or   rax, 0x01      ; set LSB
xor  rax, rax       ; zero register (faster than mov rax,0)
not  rax            ; flip all bits (does NOT set flags)

; Shifts
shl  rax, 3         ; rax *= 8  (logical left)
shr  rax, 3         ; rax /= 8  (logical right, unsigned)
sar  rax, 3         ; rax /= 8  (arithmetic right, signed)
rol  rax, 1         ; rotate left (bit wraps from MSB to LSB)

; Count in CL for variable shifts
mov  cl, 5
shl  rax, cl        ; rax <<= 5` },
        { t: "warn", items: [
          "IDIV requires CDQ (32-bit) or CQO (64-bit) to sign-extend RAX into RDX first.",
          "NOT sets no flags. NEG sets CF (always, unless result=0) and ZF.",
          "XOR eax,eax is preferred over MOV eax,0 — shorter encoding AND zero-extends RAX.",
          "SAR rounds toward -∞. In C, signed >> is implementation-defined, but x86 SAR is arithmetic.",
          "Shift count ≥ word size: undefined in C (1U << 32 on 32-bit int is UB).",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 6
  {
    number: 6, short: "Addressing & Control Flow",
    title: "Topic 6 – Addressing Modes, MOV/LEA, Jumps, Loops & Switch",
    overview: "x86-64 has one of the richest addressing modes of any architecture: base + index×scale + displacement. MOV reads from memory; LEA computes the address without reading memory. Conditional jumps use RFLAGS set by CMP/TEST.",
    sections: [
      { heading: "Addressing Modes", icon: "📍", color: "indigo", blocks: [
        { t: "dia", label: "Full addressing mode syntax: [base + index×scale + displacement]", c:
`Immediate:        MOV rax, 42          ; literal 42
Register:         MOV rax, rbx         ; value from rbx
Memory indirect:  MOV rax, [rbx]       ; value AT address rbx
Base + disp:      MOV rax, [rbx + 8]   ; struct field access
Base + idx×scale: MOV rax, [rbx + rcx*8]
Full form:        MOV rax, [rbx + rcx*8 + 16]

Rules:
  scale ∈ {1, 2, 4, 8} only
  index register ≠ RSP
  RIP-relative: [rel label]  (position-independent code)` },
      ]},
      { heading: "MOV vs LEA", icon: "🏷️", color: "violet", blocks: [
        { t: "p", c: "This distinction trips up almost everyone. MOV [expr] dereferences memory — it reads or writes the value AT the computed address. LEA [expr] computes the address itself as an integer and stores it in the destination register. No memory is accessed." },
        { t: "dia", c:
`MOV rax, [rbx + rcx*4 + 8]
   → reads 8 bytes from memory at address (rbx + rcx×4 + 8)
   → rax = Memory[rbx + rcx×4 + 8]

LEA rax, [rbx + rcx*4 + 8]
   → computes the address arithmetic only, no memory access
   → rax = rbx + rcx×4 + 8` },
        { t: "code", label: "LEA tricks — fast multiply by non-power-of-2:", c:
`lea rax, [rax + rax*2]    ; rax = rax * 3
lea rax, [rax*5]           ; rax = rax * 5
lea rax, [rbx + rax*8]    ; rax = rbx + rax*8

; Also: address of local variable
lea rdi, [rbp - 16]       ; pointer to local var, no memory read` },
      ]},
      { heading: "Jumps, Loops & Switch", icon: "🔀", color: "amber", blocks: [
        { t: "table", h: ["Instruction", "Condition", "Flags"], r: [
          ["JE / JZ", "Equal / Zero", "ZF=1"],
          ["JNE / JNZ", "Not equal", "ZF=0"],
          ["JL / JNGE", "Less (signed)", "SF≠OF"],
          ["JLE / JNG", "Less or equal (signed)", "ZF=1 or SF≠OF"],
          ["JG / JNLE", "Greater (signed)", "ZF=0 and SF=OF"],
          ["JGE / JNL", "Greater or equal (signed)", "SF=OF"],
          ["JB / JNAE", "Below (unsigned)", "CF=1"],
          ["JA / JNBE", "Above (unsigned)", "CF=0 and ZF=0"],
        ]},
        { t: "code", label: "FOR loop pattern:", c:
`; for (int i = 0; i < n; i++) { body }
    xor  ecx, ecx        ; i = 0
.loop:
    cmp  ecx, edi        ; i < n? (n in EDI)
    jge  .done
    ; body here
    inc  ecx             ; i++
    jmp  .loop
.done:` },
        { t: "code", label: "Switch-case as jump table:", c:
`; switch(i) with cases 0,1,2,3
    cmp  rdi, 3
    ja   .default           ; out of range → default
    lea  rax, [rel .table]
    jmp  [rax + rdi*8]      ; indirect jump through table
.table:
    dq  .case0, .case1, .case2, .case3` },
        { t: "warn", items: [
          "LEA does NOT access memory — it only computes. MOV [expr] DOES access memory.",
          "JL is SIGNED (checks SF≠OF). JB is UNSIGNED (checks CF). Wrong choice = wrong branch.",
          "LOOP instruction decrements RCX then jumps if RCX≠0. If RCX=0 before LOOP, it becomes 2⁶⁴-1.",
          "Jump table only works for dense cases. Sparse cases compile to chains of CMP+JE.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 7
  {
    number: 7, short: "Stack & Procedures",
    title: "Topic 7 – Stack, Calling Conventions, Stack Frames & Recursion",
    overview: "The stack grows downward. CALL pushes the return address; RET pops it. System V AMD64 ABI: first 6 integer args go in registers (RDI RSI RDX RCX R8 R9), return value in RAX. Each function creates a stack frame.",
    sections: [
      { heading: "Stack Mechanics", icon: "📚", color: "indigo", blocks: [
        { t: "dia", label: "Stack grows toward lower addresses:", c:
`High addresses
┌───────────────────────┐
│    argument 7+        │ [RBP + 16 + 8*(n-7)]
├───────────────────────┤
│    return address     │ [RBP + 8]   ← pushed by CALL
├───────────────────────┤ ← RBP points here after prologue
│    saved old RBP      │ [RBP + 0]
├───────────────────────┤
│    local variable 1   │ [RBP - 8]
├───────────────────────┤
│    local variable 2   │ [RBP - 16]
├───────────────────────┤
│     (red zone)        │  128 bytes, leaf functions only
└───────────────────────┘ ← RSP points here
Low addresses` },
        { t: "table", h: ["Instruction", "Effect"], r: [
          ["PUSH src", "RSP -= 8; [RSP] = src"],
          ["POP dst", "dst = [RSP]; RSP += 8"],
          ["CALL label", "PUSH RIP; JMP label"],
          ["RET", "POP RIP; JMP RIP"],
          ["LEAVE", "MOV RSP,RBP; POP RBP  (shorthand for epilogue)"],
        ]},
      ]},
      { heading: "System V AMD64 Calling Convention", icon: "📞", color: "violet", blocks: [
        { t: "dia", label: "Argument passing and register preservation:", c:
`Integer/pointer arguments (in order):
  1st: RDI   2nd: RSI   3rd: RDX
  4th: RCX   5th: R8    6th: R9
  7th+: pushed on stack right-to-left

Return value:  RAX (integer/pointer)
               RDX:RAX (128-bit)
               XMM0 (float/double)

Caller-saved (callee may clobber freely):
  RAX  RCX  RDX  RSI  RDI  R8  R9  R10  R11

Callee-saved (callee MUST restore before RET):
  RBX  RBP  R12  R13  R14  R15` },
        { t: "code", label: "Standard function prologue/epilogue:", c:
`my_func:
    push rbp           ; save caller's RBP (callee-saved)
    mov  rbp, rsp      ; set frame base
    sub  rsp, 32       ; allocate 32 bytes for locals (must keep RSP 16-aligned!)
    ; args in RDI, RSI, RDX, RCX, R8, R9
    ; locals at [rbp-8], [rbp-16], etc.
    mov  rax, [rbp-8]  ; read local var
    leave              ; MOV RSP,RBP; POP RBP
    ret` },
        { t: "p", c: "Red zone: the 128 bytes below RSP are guaranteed not to be clobbered by signal handlers or interrupts. Leaf functions (those that call no other functions) can use this space for locals without adjusting RSP." },
      ]},
      { heading: "Recursion & Stack Frames", icon: "🔁", color: "amber", blocks: [
        { t: "p", c: "Recursive functions work identically to non-recursive ones — each call gets its own stack frame with its own copy of local variables. The call chain unwinds as each RET pops back to the caller." },
        { t: "code", label: "Recursive factorial in NASM:", c:
`; int64 factorial(int64 n) — n in RDI, result in RAX
factorial:
    push rbp
    mov  rbp, rsp
    sub  rsp, 16

    cmp  rdi, 1
    jle  .base           ; if n <= 1, return 1

    mov  [rbp-8], rdi    ; save n (RDI is caller-saved!)
    dec  rdi
    call factorial       ; recursive call: factorial(n-1) → RAX
    imul rax, [rbp-8]   ; result * n

    leave
    ret

.base:
    mov  rax, 1
    leave
    ret` },
        { t: "warn", items: [
          "After CALL, RSP misaligned by 8. PUSH RBP in prologue re-aligns to 16.",
          "Callee must save/restore RBX R12–R15. Failing to restore = caller gets corrupted value.",
          "[RBP+8] = return address. [RBP+16] = 7th arg (if any). [RBP-8] = first local.",
          "1st arg arrives in RDI, NOT RAX. Return value goes into RAX.",
          "Red zone: only for LEAF functions. Signal delivery can overwrite it in non-leaf.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 8
  {
    number: 8, short: "NASM Macros",
    title: "Topic 8 – NASM Preprocessor, Single-line & Multi-line Macros",
    overview: "The NASM preprocessor runs a full text-substitution pass before assembly. %define replaces text at use time. %macro/%endmacro creates parameterized multi-line macros. Local labels (%%label) prevent duplicate symbol errors.",
    sections: [
      { heading: "%define & %assign", icon: "📌", color: "indigo", blocks: [
        { t: "code", c:
`; %define: text substitution (lazy — evaluated at use site)
%define WIDTH  80
%define SQUARE(x)  ((x)*(x))

    mov  rax, WIDTH         ; → mov rax, 80
    mov  rbx, SQUARE(5)     ; → mov rbx, ((5)*(5))

; %assign: numeric constant (eager — evaluated at definition)
%assign BUFSIZE  1024
%assign BUFSIZE  BUFSIZE * 2   ; now 2048  (ok with %assign, not %define)

; %undef: remove macro
%undef WIDTH

; %xdefine: expand args at definition time (prevents re-expansion)
%define A  5
%xdefine B  A    ; B = 5 immediately
%define  A  10
; B is still 5, A is now 10` },
      ]},
      { heading: "%macro / %endmacro", icon: "📦", color: "violet", blocks: [
        { t: "code", c:
`; Syntax: %macro name nparams
;   %1, %2, ... = parameters
;   %%label     = local label (unique per expansion)

%macro PUSHREGS 0
    push rbx
    push r12
    push r13
%endmacro

%macro POPREGS 0
    pop  r13
    pop  r12
    pop  rbx
%endmacro

; Parameterized with local label:
%macro REPEAT 2        ; %1 = register, %2 = count
    mov  rcx, %2
%%top:
    ; loop body uses %1
    dec  rcx
    jnz  %%top         ; %%top unique per expansion!
%endmacro

; Variable args: %macro name 1-*
;   %0 = count of actual args
;   %{1:3} = first 3 args` },
      ]},
      { heading: "Conditionals & %include", icon: "🔀", color: "amber", blocks: [
        { t: "code", c:
`; Include guard pattern:
%ifndef _MYLIB_INC
%define _MYLIB_INC

    ; library code here

%endif

; Conditional assembly:
%ifdef DEBUG
    ; debug-only code
%else
    ; release code
%endif

; %if with expression:
%if BITS == 64
    mov rax, rdi
%else
    mov eax, [esp+4]
%endif

; %rep: repeat block N times (compile-time, NOT a runtime loop)
%rep 4
    nop
%endrep    ; emits 4 NOP instructions` },
        { t: "warn", items: [
          "%define is LAZY text substitution — no evaluation. %assign evaluates at definition time.",
          "Without %%label inside a macro, multiple expansions create duplicate label error.",
          "Macros save NO registers automatically. Modifying caller-saved regs inside = caller's values gone.",
          "%rep duplicates code — code size grows ×N. NOT a runtime loop.",
          "NASM macro names are case-sensitive. %macro Foo and %macro foo are different.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 9
  {
    number: 9, short: "STRUC & Alignment",
    title: "Topic 9 – STRUC, ISTRUC & Alignment Principles",
    overview: "STRUC defines a struct memory layout (a template — no bytes allocated). ISTRUC allocates and initializes an instance. Alignment means each field must start at an address divisible by its own size. Compilers/assemblers add padding to enforce this.",
    sections: [
      { heading: "STRUC & ISTRUC", icon: "🗂️", color: "indigo", blocks: [
        { t: "code", c:
`; Define struct layout (no memory allocated)
STRUC Person
    .age    resb 1     ; byte  at offset 0
    .pad    resb 3     ; manual padding to align .score
    .score  resd 1     ; dword at offset 4
    .name   resb 16    ; 16 bytes at offset 8
ENDSTRUC
; NASM auto-creates: Person_size = 24

; Instantiate (allocates memory):
john: ISTRUC Person
    AT Person.age,   db 21
    AT Person.score, dd 95
    AT Person.name,  db "John", 0
IEND

; Access fields:
mov al, [john + Person.age]     ; load age
mov eax, [john + Person.score]  ; load score` },
      ]},
      { heading: "Alignment Rules & Padding", icon: "📐", color: "violet", blocks: [
        { t: "p", c: "Natural alignment: a field of size N bytes must sit at an address that is a multiple of N. The CPU may perform multiple memory bus cycles for misaligned access (performance penalty), and some CPUs (ARM) fault entirely." },
        { t: "dia", label: "Padding example — struct { char a; int b; char c; }:", c:
`Byte offset: 0    1    2    3    4    5    6    7    8    9   10   11
             ┌────┬────┬────┬────┬────┴────┴────┘┌────┬────┬────┬────┐
             │ a  │ P  │ P  │ P  │       b (int) ││ c  │ P  │ P  │ P  │
             └────┴────┴────┴────┴───────────────┘└────┴────┴────┴────┘
             P = padding byte                     sizeof = 12, not 6!` },
        { t: "table", h: ["Type", "Alignment requirement", "Notes"], r: [
          ["char (1B)", "any address", ""],
          ["short (2B)", "multiple of 2", "even address"],
          ["int (4B)", "multiple of 4", ""],
          ["int64 (8B)", "multiple of 8", ""],
          ["XMM (16B)", "multiple of 16", "SSE instructions"],
          ["YMM (32B)", "multiple of 32", "AVX instructions"],
          ["struct", "largest member's alignment", "plus trailing padding"],
        ]},
        { t: "code", label: "Minimize padding — order fields largest-first:", c:
`// BAD:  char(1) + int(4) + char(1) = 12 bytes (4 bytes wasted)
struct { char a; int b; char c; };

// GOOD: int(4) + char(1) + char(1) = 8 bytes (2 bytes waste at end only)
struct { int b; char a; char c; };

// In NASM:
ALIGN 4    ; pad to 4-byte boundary before int field
ALIGNB 16  ; for data sections (uses 0x00, not NOP)` },
        { t: "warn", items: [
          "sizeof(struct) ≠ sum of field sizes. Padding bytes inflate it.",
          "Struct has trailing padding so that arrays of structs maintain alignment.",
          "STRUC allocates NO memory. ISTRUC does.",
          "ALIGN N in NASM: N must be a power of 2.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 10
  {
    number: 10, short: "Data Types & Arrays",
    title: "Topic 10 – Data Types, 1D/2D/3D Arrays in NASM",
    overview: "NASM defines data with db/dw/dd/dq. Arrays are contiguous in memory. Element access = base + index × element_size. C stores 2D arrays in row-major order: all of row 0, then row 1, etc.",
    sections: [
      { heading: "NASM Data Directives", icon: "📋", color: "indigo", blocks: [
        { t: "table", h: ["Directive", "Size", "Example", "Notes"], r: [
          ["db", "1 byte", "db 0x41, 'A', 65", "All equivalent"],
          ["dw", "2 bytes", "dw 1000", "word"],
          ["dd", "4 bytes", "dd 3.14", "float literal OK"],
          ["dq", "8 bytes", "dq 0xDEADBEEF", "qword"],
          ["dt", "10 bytes", "dt 3.14159", "80-bit extended float"],
          ["resb N", "N bytes", "buf resb 256", "uninit, BSS"],
          ["resd N", "N×4 bytes", "arr resd 100", "100 ints, uninit"],
          ["times N dx val", "N copies", "times 8 db 0", "8 zero bytes"],
        ]},
        { t: "code", c:
`section .data
    arr    dd 10, 20, 30, 40   ; 4 ints = 16 bytes
    msg    db "Hello", 10, 0   ; string with newline + null
    pi     dq 3.141592653589793
    LEN    equ $ - msg         ; compile-time constant, NOT a label

section .bss
    buffer resb 1024           ; 1024 uninitialized bytes` },
      ]},
      { heading: "1D & 2D Array Access", icon: "📊", color: "violet", blocks: [
        { t: "dia", label: "Array element address formula:", c:
`1D: addr(arr[i])    = base + i × sizeof(element)
2D: addr(a[r][c])   = base + (r × COLS + c) × sizeof(element)
3D: addr(a[d][r][c])= base + (d × ROWS × COLS + r × COLS + c) × sizeof(element)

Example — int a[3][4], element a[1][2]:
  offset = (1 × 4 + 2) × 4 = 6 × 4 = 24 bytes from base` },
        { t: "dia", label: "int a[3][4] in memory (row-major, C order):", c:
`         col0     col1     col2     col3
row 0: [a[0][0]][a[0][1]][a[0][2]][a[0][3]]
row 1: [a[1][0]][a[1][1]][a[1][2]][a[1][3]]
row 2: [a[2][0]][a[2][1]][a[2][2]][a[2][3]]

Contiguous in memory: a[0][0] a[0][1] a[0][2] a[0][3] a[1][0] ...` },
        { t: "code", label: "NASM — access a[rcx][rdx] (int array, COLS=4):", c:
`; a[rcx][rdx] where COLS=4, element=int(4B)
; offset = (rcx * 4 + rdx) * 4
lea  rax, [rcx*4 + rdx]    ; rax = rcx*4 + rdx (index)
mov  eax, [arr + rax*4]    ; load element (scale=4 for int)` },
        { t: "warn", items: [
          "resd N reserves N × 4 bytes (N dwords). resb N reserves N bytes. Easy to confuse.",
          "2D offset uses COLS (width), NOT ROWS. Formula: (r×COLS + c) × elem_size.",
          "Row-major: traversing by column-first (a[0][0], a[1][0], ...) = stride=COLS → cache-unfriendly.",
          "EQU creates a compile-time constant — NOT a label. Cannot take its address.",
          "times 10 dd 0 is static initialization. Does NOT create a runtime loop.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 11
  {
    number: 11, short: "Memory Layout",
    title: "Topic 11 – Memory Layout for Running Application & Memory Transactions",
    overview: "A process's virtual address space is divided into fixed segments. Code, data, BSS, heap (grows up), and stack (grows down). Memory transactions go through the cache hierarchy before hitting DRAM. Write-back vs write-through determines when DRAM gets updated.",
    sections: [
      { heading: "Virtual Address Space", icon: "🗺️", color: "indigo", blocks: [
        { t: "dia", label: "Linux x86-64 process address space:", c:
`0xFFFFFFFFFFFFFFFF ┌──────────────────────────┐
                   │       Kernel Space        │ inaccessible from user mode
0x00007FFFFFFFFFFF ├──────────────────────────┤
                   │   Stack (grows ↓)         │ local vars, frames, saved regs
                   │          ↓               │
                   ├──────────────────────────┤
                   │   Memory-mapped region   │ shared libs (.so), mmap files
                   ├──────────────────────────┤
                   │          ↑               │
                   │   Heap (grows ↑)          │ malloc/free
                   ├──────────────────────────┤
                   │   BSS segment             │ uninit globals, zero-inited by OS
                   ├──────────────────────────┤
                   │   Data segment            │ initialized global/static vars
                   ├──────────────────────────┤
0x0000000000400000 │   Text segment            │ machine code (read-only, exec)
0x0000000000000000 └──────────────────────────┘` },
        { t: "table", h: ["Segment", "Content", "Init", "File space"], r: [
          [".text", "Machine code", "from binary", "yes"],
          [".data", "Initialized globals/statics", "from binary", "yes"],
          [".bss", "Uninitialized globals/statics", "OS zeroes it", "NO (just size)"],
          ["heap", "malloc() allocations", "depends", "no (dynamic)"],
          ["stack", "Local vars, frames", "depends", "no (dynamic)"],
        ]},
      ]},
      { heading: "Memory Read/Write Transactions", icon: "⚡", color: "violet", blocks: [
        { t: "dia", label: "Cache hierarchy and write policies:", c:
`CPU → L1 (32KB, ~4 cycles) → L2 (256KB, ~12 cycles) → L3 (8MB+, ~40 cycles) → DRAM (~100 ns)

Write-through:
  Every write → update cache AND next level simultaneously
  Simple, DRAM always up to date, higher bandwidth demand

Write-back:
  Write → update cache only, set "dirty" bit
  Dirty line written to next level only on EVICTION
  Better performance, DRAM may be stale

Write-allocate (with write-back):
  On write miss: load line into cache first, then modify
  Assumes more writes to same cache line follow

No-write-allocate (with write-through):
  On write miss: write directly to next level, skip cache` },
        { t: "warn", items: [
          "BSS takes NO space in the ELF file. OS zero-initializes it on load.",
          "free() does NOT zero memory or return it to OS — just adds to heap free list.",
          "Write-back: DRAM has stale data. DMA devices read DRAM directly — must cache-flush before DMA.",
          "Text segment is read-only. Writing to it → SIGSEGV.",
          "Stack grows DOWN; heap grows UP. Both growing toward each other can collide.",
          "False sharing: two threads write different vars in same 64-byte cache line → cache bounces.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 12
  {
    number: 12, short: "Cache",
    title: "Topic 12 – Memory Hierarchy: Cache",
    overview: "Caches exploit temporal locality (reuse same data soon) and spatial locality (access nearby data). A cache is organized as S sets × E ways × B bytes per line. On a miss, the full 64-byte cache line is fetched. Replacement policy (LRU) decides which way to evict.",
    sections: [
      { heading: "Cache Organization", icon: "⚡", color: "indigo", blocks: [
        { t: "dia", label: "Cache structure (S sets, E ways, B bytes/line):", c:
`        Way 0              Way 1           ...     Way E-1
      ┌───┬──────┬──────┐ ┌───┬──────┬──────┐   ┌───┬──────┬──────┐
Set 0 │ V │ Tag  │ Data │ │ V │ Tag  │ Data │...│ V │ Tag  │ Data │
      └───┴──────┴──────┘ └───┴──────┴──────┘   └───┴──────┴──────┘
Set 1 │ V │ Tag  │ Data │ │ V │ Tag  │ Data │...│ V │ Tag  │ Data │
  .
  .
Set S-1 ...

V = valid bit. Tag = upper bits of address. Data = B bytes.
Cache size = S × E × B  bytes` },
        { t: "table", h: ["Type", "Sets", "Ways", "Conflict misses", "Hardware cost"], r: [
          ["Direct-mapped", "many", "1", "high", "low"],
          ["E-way set-assoc", "S", "E", "reduced", "medium"],
          ["Fully associative", "1", "all", "none", "very high"],
        ]},
      ]},
      { heading: "Address Decomposition", icon: "🔢", color: "violet", blocks: [
        { t: "dia", label: "How a 64-bit address maps to cache:", c:
`Address bits (from low to high):
┌──────────────────┬──────────────┬──────────────┐
│   Block Offset   │  Set Index   │     Tag      │
│     b bits       │   s bits     │  remaining   │
└──────────────────┴──────────────┴──────────────┘

b = log₂(B)   → which byte within the cache line
s = log₂(S)   → which set to look in
tag = rest    → stored in cache to verify it's the right line

Example: 32KB, 8-way, 64B lines
  B=64  → b=6
  S = 32768 / (8×64) = 64  → s=6
  tag = 64 - 6 - 6 = 52 bits` },
        { t: "dia", label: "Cache lookup process:", c:
`1. Extract set index s bits → go to that set
2. Compare tag against all E ways simultaneously
3. If valid=1 AND tag matches → HIT → return byte at offset
4. If no match → MISS → fetch 64-byte line from next level
5. On miss: if set full → evict one way (LRU), install new line` },
      ]},
      { heading: "Miss Types & Optimization", icon: "🔄", color: "amber", blocks: [
        { t: "table", h: ["Miss type", "Cause", "Fix"], r: [
          ["Compulsory (cold)", "First access ever", "Prefetching"],
          ["Capacity", "Working set > cache", "Reduce data set size"],
          ["Conflict", "Many blocks map to same set", "Higher associativity, pad arrays"],
        ]},
        { t: "p", c: "Cache performance is dominated by access patterns. Sequential (stride-1) access is ideal — each cache miss loads 64 bytes, and subsequent 15 accesses hit. Stride=cache_size/associativity access thrashes the cache (all accesses map to the same set)." },
        { t: "code", label: "Cache-friendly vs unfriendly 2D array traversal:", c:
`// GOOD: row-major (sequential in memory, stride-1)
for (int r = 0; r < R; r++)
  for (int c = 0; c < C; c++)
    sum += a[r][c];    // a[r][0..C-1] all in nearby cache lines

// BAD: column-major (stride=C, each access a cache miss)
for (int c = 0; c < C; c++)
  for (int r = 0; r < R; r++)
    sum += a[r][c];    // a[0][c], a[1][c]... = stride C apart` },
        { t: "warn", items: [
          "Set index bits come from the MIDDLE of the address, not MSBs or LSBs.",
          "Stride = S×B (cache_size / associativity) → thrashing: all accesses map to same set.",
          "Write-back: dirty cache line means DRAM has stale data until eviction.",
          "Larger block size: better spatial locality but higher miss penalty and bandwidth.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 13
  {
    number: 13, short: "DRAM",
    title: "Topic 13 – Memory Hierarchy: DRAM",
    overview: "DRAM stores bits as charge in capacitors. Charge leaks — DRAM must be refreshed every ~64ms. Organized in banks of rows and columns. Opening a row loads it into a sense-amplifier row buffer. DDR doubles bandwidth by transferring on both clock edges.",
    sections: [
      { heading: "DRAM Cell & Organization", icon: "🔋", color: "indigo", blocks: [
        { t: "dia", label: "DRAM vs SRAM comparison:", c:
`                    DRAM                    SRAM
Cell:               capacitor + transistor   6-transistor flip-flop
Bits per cell:      1 (traditional)          1
Refresh needed:     YES (~64ms)              NO
Density:            high                     low (6× larger per bit)
Speed:              slower (~ns)             faster (~sub-ns)
Cost:               cheap                    expensive
Used for:           main memory              caches (L1/L2/L3)` },
        { t: "p", c: "DRAM is organized in banks. Each bank has a grid of rows and columns. When a row is accessed, the entire row (~8KB) is loaded into sense amplifiers called the row buffer. Subsequent accesses to the same row can skip the RAS step (row buffer hit) — much faster." },
      ]},
      { heading: "DRAM Access Timing", icon: "⏱️", color: "violet", blocks: [
        { t: "dia", label: "DRAM access sequence:", c:
`CPU request
    │
    ▼
[Send Row Address (RAS)] ──→ wait tRCD (row-to-column delay)
    │
    ▼
[Row opens → entire row in row buffer]
    │
    ▼
[Send Column Address (CAS)] ──→ wait tCL (CAS latency)
    │
    ▼
[Data returned to CPU] ──→ burst: subsequent columns come quickly
    │
    ▼
[Precharge (close row)] ──→ wait tRP → ready for next row

Timing example DDR4-3200 CL16: tCL=16, tRCD=16, tRP=16 (in nanoseconds)` },
        { t: "table", h: ["Timing param", "Meaning", "Typical DDR4"], r: [
          ["tRCD", "RAS-to-CAS delay (open row)", "~10–16 ns"],
          ["tCL", "CAS latency (column access)", "~10–16 ns"],
          ["tRP", "Row precharge time", "~10–16 ns"],
          ["tRAS", "Row active time (min)", "~35–45 ns"],
        ]},
      ]},
      { heading: "DDR & Bandwidth", icon: "📡", color: "amber", blocks: [
        { t: "p", c: "DDR (Double Data Rate) transfers data on both the rising and falling edge of the clock. So DDR4-3200 has a 1600 MHz actual clock but 3200 MT/s (megatransfers per second). With a 64-bit bus, peak bandwidth = 3200 × 8 bytes = 25.6 GB/s." },
        { t: "table", h: ["Standard", "Clock", "Data rate", "Peak BW (64-bit)"], r: [
          ["DDR4-2400", "1200 MHz", "2400 MT/s", "19.2 GB/s"],
          ["DDR4-3200", "1600 MHz", "3200 MT/s", "25.6 GB/s"],
          ["DDR5-4800", "2400 MHz", "4800 MT/s", "38.4 GB/s"],
          ["DDR5-6400", "3200 MHz", "6400 MT/s", "51.2 GB/s"],
        ]},
        { t: "warn", items: [
          "DRAM requires refresh every ~64ms. Refresh temporarily blocks normal access.",
          "Row buffer HIT is much faster (just CAS latency). Access same row repeatedly = optimal.",
          "DDR4-3200 clock = 1600 MHz. The '3200' is MT/s (doubled by DDR). Don't confuse.",
          "DRAM is volatile — all data lost on power loss. Flash (SSD) is non-volatile.",
          "More DRAM ranks = more capacity but rank switching adds latency.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 14
  {
    number: 14, short: "HDD & SSD",
    title: "Topic 14 – Memory Hierarchy: HDD and SSD",
    overview: "HDD latency is dominated by mechanical movement: seek (move head to track) + rotational latency (wait for sector). SSD has no moving parts — NAND flash reads are fast but writes require erasing an entire block first.",
    sections: [
      { heading: "HDD Mechanics", icon: "💿", color: "indigo", blocks: [
        { t: "dia", label: "HDD structure:", c:
`Actuator arm
    │
    └──→ Read/write head (floats nm above platter)
              │
              ▼
    ┌─────────────────────────────────┐
    │         Platter (spinning)      │
    │  ┌─────────────────────────┐   │
    │  │  Track (concentric ring)│   │
    │  │  ┌──────────────────┐   │   │
    │  │  │ Sector (~4KB)    │   │   │
    │  │  └──────────────────┘   │   │
    │  └─────────────────────────┘   │
    └─────────────────────────────────┘
    Cylinder = same track # across all platters` },
        { t: "p", c: "Access time = seek time + rotational latency + transfer time. Rotational latency averages half a rotation. At 7200 RPM: avg rotational latency = 60/(2×7200) ≈ 4.17 ms. A full rotation = 60/7200 ≈ 8.33 ms." },
        { t: "table", h: ["Component", "Typical time", "Notes"], r: [
          ["Seek time", "3–10 ms", "avg ~5ms. Moving head across tracks"],
          ["Rotational latency", "0–8.3 ms", "avg ~4ms at 7200 RPM"],
          ["Transfer time", "~0.05 ms", "for 4KB sector at 100MB/s"],
          ["Total average", "~9 ms", "dominated by seek + rotation"],
        ]},
      ]},
      { heading: "SSD Technology", icon: "💾", color: "violet", blocks: [
        { t: "p", c: "NAND flash stores bits in floating-gate transistors. The critical constraint: flash cannot overwrite in place. You must erase an entire erase block (~256KB) before writing new pages (~4KB). This is managed transparently by the Flash Translation Layer (FTL)." },
        { t: "dia", label: "SSD write process:", c:
`Write new data to page P:
  1. If P's block has free pages → write directly (fast)
  2. If P's block is full:
     a. Copy all VALID pages in block to a new block
     b. Erase entire old block (slow, ~1ms)
     c. Write new data to erased block
  → Write Amplification: writing 1 page causes entire block rewrite` },
        { t: "table", h: ["NAND Type", "Bits/cell", "P/E cycles", "Speed", "Use"], r: [
          ["SLC", "1", "~100,000", "fastest", "Enterprise, cache"],
          ["MLC", "2", "~10,000", "fast", "Consumer"],
          ["TLC", "3", "~3,000", "medium", "Budget consumer"],
          ["QLC", "4", "~1,000", "slowest", "High capacity"],
        ]},
      ]},
      { heading: "Performance Comparison", icon: "📊", color: "amber", blocks: [
        { t: "table", h: ["Metric", "HDD (7200 RPM)", "SATA SSD", "NVMe SSD"], r: [
          ["Sequential read", "~150 MB/s", "~550 MB/s", "3–7 GB/s"],
          ["Random 4K read", "~0.5 MB/s", "~400 MB/s", "~2 GB/s"],
          ["Random IOPS", "~100", "~100,000", "~1,000,000"],
          ["Read latency", "~9 ms", "~0.1 ms", "~0.02 ms"],
          ["Cost per TB", "~$20", "~$80", "~$100+"],
        ]},
        { t: "warn", items: [
          "Rotational latency avg = 60/(2×RPM) seconds. Don't forget the ½ (average is half rotation).",
          "SSD cannot overwrite in place — must erase block first. Source of write amplification.",
          "TRIM tells SSD which LBAs are deleted → SSD can erase proactively → prevents write slowdown.",
          "NVMe uses PCIe directly, not SATA. Completely different protocol, much lower latency.",
          "SSD wear: each cell has limited erase cycles. Wear leveling spreads writes across all blocks.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 15
  {
    number: 15, short: "Linkers",
    title: "Topic 15 – Linkers, Symbol Types, Resolution & Libraries",
    overview: "The linker combines object files (.o) into an executable. It resolves symbolic references to addresses and patches (relocates) all the call/jump instructions. Static libraries copy code in; dynamic libraries are loaded at runtime.",
    sections: [
      { heading: "Symbols & Relocation", icon: "🔗", color: "indigo", blocks: [
        { t: "dia", label: "Compilation and linking pipeline:", c:
`foo.c ──[cc -c]──→ foo.o ──┐
bar.c ──[cc -c]──→ bar.o ──┼──→ [ld (linker)] ──→ executable
libx.a ─────────────────────┘

Inside each .o:
  .text:   machine code with placeholder addresses (0x0)
  .data:   initialized data
  .symtab: symbol table (defined + referenced symbols)
  .rel:    relocation entries (where to patch once addresses known)` },
        { t: "p", c: "Relocation: after the linker assigns final addresses to all sections and symbols, it goes back through each object file and patches all the placeholder addresses using the relocation entries." },
      ]},
      { heading: "Symbol Resolution Rules", icon: "⚖️", color: "violet", blocks: [
        { t: "p", c: "Every symbol is either strong or weak. The linker picks one definition for each symbol name using fixed precedence rules." },
        { t: "table", h: ["Symbol type", "Example in C", "Rule"], r: [
          ["Strong", "int x = 5;  (initialized global)", "Only one strong allowed"],
          ["Strong", "void foo() {...}  (function def)", "Duplicate = linker error"],
          ["Weak", "int x;  (uninitialized global)", "Strong beats weak silently"],
          ["Weak + weak", "two uninitialized globals", "Linker picks one arbitrarily"],
        ]},
        { t: "warn", items: [
          "int x; in two .h files both included → two weak symbols → one silently wins. Silent data corruption.",
          "Linker processes left-to-right: -llib before main.o means main.o's references not yet seen → not resolved.",
          "Undefined symbol (no definition anywhere) → linker error.",
        ]},
      ]},
      { heading: "Static vs Dynamic Libraries", icon: "📚", color: "amber", blocks: [
        { t: "dia", label: "Static vs dynamic linking:", c:
`Static library (.a):
  ar archive of .o files
  Linker copies only needed .o into executable
  Result: self-contained, no runtime dependency, larger binary
  Link: gcc main.o -L. -lmylib -o app

Dynamic library (.so / .dll):
  Separate file, loaded by dynamic linker at program startup
  All processes share one copy in memory (saves RAM)
  PLT (Procedure Linkage Table) stubs → GOT (Global Offset Table)
  First call: dynamic linker resolves symbol → patches GOT
  Subsequent calls: direct via GOT (lazy binding)
  Link: gcc main.o -L. -lmylib -o app  (same command, .so wins)` },
        { t: "table", h: ["Aspect", "Static (.a)", "Dynamic (.so)"], r: [
          ["Binary size", "larger (code copied in)", "smaller (just references)"],
          ["Runtime deps", "none", "must have .so present"],
          ["Startup time", "faster", "dynamic linker overhead"],
          ["RAM sharing", "each process has copy", "shared between processes"],
          ["Update", "must recompile", "replace .so file"],
        ]},
        { t: "warn", items: [
          "Static lib: only .o files that satisfy undefined symbols are included. Unused code excluded.",
          "Dynamic lib missing at runtime → 'cannot open shared object file' even if linked fine.",
          "-L flag: link-time search path. LD_LIBRARY_PATH: runtime search path. Completely different.",
          "PIC (-fPIC) required for .so — uses RIP-relative addresses so code works at any load address.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 16
  {
    number: 16, short: "Exceptions",
    title: "Topic 16 – Asynchronous & Synchronous Exceptions",
    overview: "An exception is any event that causes the CPU to transfer control to an OS kernel handler. Synchronous exceptions are caused by the current instruction. Asynchronous exceptions (interrupts) come from external hardware.",
    sections: [
      { heading: "Exception Mechanism", icon: "⚡", color: "indigo", blocks: [
        { t: "dia", label: "What happens when an exception occurs:", c:
`Normal execution:   instr1 → instr2 → instr3 ← exception here!
                                           │
                                           ▼
    1. CPU finishes current micro-op (or not, for faults)
    2. Save state: push RFLAGS, CS, RIP onto kernel stack
    3. Switch to ring 0 (kernel mode), switch to kernel stack
    4. Look up handler address in Interrupt Descriptor Table (IDT)
    5. Jump to handler
    6. Handler runs, may modify saved state
    7. IRET: restore RIP, CS, RFLAGS → resume (or not)` },
        { t: "table", h: ["x86 #", "Name", "Cause", "Type"], r: [
          ["#DE (0)", "Divide Error", "DIV/IDIV by zero", "Fault"],
          ["#BP (3)", "Breakpoint", "INT 3 instruction", "Trap"],
          ["#GP (13)", "General Protection", "Privilege violation", "Fault"],
          ["#PF (14)", "Page Fault", "Invalid VA access", "Fault"],
          ["#MC (18)", "Machine Check", "Hardware error", "Abort"],
        ]},
      ]},
      { heading: "Synchronous vs Asynchronous", icon: "🔄", color: "violet", blocks: [
        { t: "dia", label: "Exception taxonomy:", c:
`EXCEPTIONS
├── Synchronous (caused by current instruction)
│   ├── TRAP: intentional. Return to NEXT instruction.
│   │   └── syscall (INT 0x80 / SYSCALL), breakpoint (INT 3)
│   ├── FAULT: recoverable. Return to SAME instruction (retry).
│   │   └── page fault (#PF), general protection (#GP)
│   └── ABORT: unrecoverable. Process terminated.
│       └── machine check (#MC), double fault (#DF)
└── Asynchronous (from external hardware, any time)
    └── INTERRUPT
        ├── Timer interrupt → CPU preemption, scheduler runs
        ├── I/O interrupt → disk/NIC signals completion
        ├── Maskable: CLI disables (EFLAGS.IF=0), STI re-enables
        └── NMI (Non-Maskable): cannot be disabled` },
        { t: "warn", items: [
          "TRAP → returns to NEXT instruction. FAULT → returns to SAME instruction (to retry). ABORT → no return.",
          "Page fault is a FAULT: OS loads the page, then CPU re-executes the SAME faulting instruction.",
          "SYSCALL is a trap — program continues from the instruction AFTER the syscall.",
          "Interrupts are asynchronous — can arrive between any two instructions.",
          "Kernel mode switch: privilege 3→0, stack switches to kernel stack. IRET reverses this.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 17
  {
    number: 17, short: "Processes & Threads",
    title: "Topic 17 – Processes, Threads, Race Conditions & Background Jobs",
    overview: "A process is a running program instance with its own address space, PID, and file descriptors. fork() creates a child by copying the parent. exec() replaces the process image. Threads share the address space — easier communication, but shared state requires synchronization.",
    sections: [
      { heading: "Process Model & System Calls", icon: "🖥️", color: "indigo", blocks: [
        { t: "dia", label: "Process lifecycle:", c:
`fork()     exec()        exit()
  │           │              │
Parent ──→ Child ──→ [new prog] ──→ Zombie ──→ (reaped by parent wait())
  │                                              │
  └──────────── wait() ──────────────────────────┘

Process states:
  Running  ──preempt──→  Ready  ──schedule──→  Running
  Running  ──block────→  Blocked ──I/O done──→  Ready` },
        { t: "code", label: "fork() + exec() pattern:", c:
`pid_t pid = fork();
if (pid < 0)  { perror("fork"); exit(1); }      // error
if (pid == 0) {                                   // child
    execvp("ls", (char*[]){"ls", "-la", NULL});
    perror("exec");  // only reached if exec fails
    exit(1);
}
// parent continues here
int status;
waitpid(pid, &status, 0);    // reap child (prevent zombie)
if (WIFEXITED(status))
    printf("child exited: %d\n", WEXITSTATUS(status));` },
      ]},
      { heading: "Threads & Race Conditions", icon: "🧵", color: "violet", blocks: [
        { t: "dia", label: "Process vs Thread:", c:
`Process A                    Process B
┌────────────────────┐       ┌────────────────────┐
│ Virtual addr space │       │ Virtual addr space │
│ Code / Heap / Stack│       │ Code / Heap / Stack│
│ File descriptors   │       │ File descriptors   │
└────────────────────┘       └────────────────────┘
       separate                      separate

Thread 1          Thread 2          Thread 3
┌────────┐        ┌────────┐        ┌────────┐
│ Stack  │        │ Stack  │        │ Stack  │  separate per thread
│ Regs   │        │ Regs   │        │ Regs   │
└────────┘        └────────┘        └────────┘
└────────────────────────────────────────────┘
              SHARED: code, heap, globals, FDs` },
        { t: "code", label: "Race condition example:", c:
`int balance = 1000;

// Thread A and B both run this simultaneously:
void withdraw(int amount) {
    if (balance >= amount) {         // ← A checks: 1000 >= 500 ✓
        // ← context switch! B checks: 1000 >= 500 ✓
        balance -= amount;           // both deduct!
    }                                // balance = 0, not 500
}` },
        { t: "warn", items: [
          "After fork(): BOTH parent AND child continue from the line AFTER fork().",
          "fork() return: >0 (child PID) to parent, 0 to child, -1 on error.",
          "exec() replaces everything — code, data, stack. FDs survive unless FD_CLOEXEC.",
          "Zombie: child exited but parent not called wait(). Occupies process table slot.",
          "Race condition: 'usually works' is NOT proof of correctness.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 18
  {
    number: 18, short: "Signals",
    title: "Topic 18 – Signals, Signal Handlers & Nonlocal Jumps",
    overview: "Signals are software interrupts. Each signal has a default action (terminate, core dump, stop, ignore). Custom handlers can be registered. SIGKILL(9) and SIGSTOP(19) cannot be caught. Only async-signal-safe functions are safe to call inside handlers.",
    sections: [
      { heading: "Signal Basics", icon: "📡", color: "indigo", blocks: [
        { t: "table", h: ["Signal", "Number", "Default action", "Notes"], r: [
          ["SIGINT", "2", "Terminate", "Ctrl+C. Catchable."],
          ["SIGQUIT", "3", "Core dump", "Ctrl+\\"],
          ["SIGKILL", "9", "Terminate", "UNCATCHABLE. Cannot block/ignore."],
          ["SIGSEGV", "11", "Core dump", "Segmentation fault"],
          ["SIGTERM", "15", "Terminate", "polite kill, catchable"],
          ["SIGCHLD", "17", "Ignore", "Child stopped/exited"],
          ["SIGSTOP", "19", "Stop", "UNCATCHABLE. Pause process."],
          ["SIGCONT", "18", "Continue", "Resume stopped process"],
          ["SIGALRM", "14", "Terminate", "alarm() timer expired"],
          ["SIGUSR1/2", "10/12", "Terminate", "User-defined purpose"],
        ]},
        { t: "p", c: "Pending signal: sent but not yet delivered (e.g. currently blocked). Only ONE signal of each type can be pending — additional signals of the same type are dropped (signals are not queued). Blocked signals stay pending until the mask is cleared with sigprocmask()." },
      ]},
      { heading: "Signal Handlers & Safety", icon: "🎯", color: "violet", blocks: [
        { t: "code", label: "Correct handler registration with sigaction:", c:
`struct sigaction sa = {0};
sa.sa_handler = my_handler;
sigemptyset(&sa.sa_mask);
sa.sa_flags = SA_RESTART;   // auto-restart interrupted syscalls
sigaction(SIGINT, &sa, NULL);

// In handler — ONLY async-signal-safe functions:
void my_handler(int sig) {
    // SAFE:
    write(STDOUT_FILENO, "caught!\n", 8);
    _exit(0);

    // UNSAFE (do NOT use in handlers):
    // printf()   — uses global buffer (not reentrant)
    // malloc()   — can deadlock if interrupted mid-alloc
    // exit()     — calls atexit handlers (not safe)
}` },
        { t: "p", c: "The safe pattern for signal handlers: set a volatile sig_atomic_t flag in the handler, and check that flag in the main event loop. The flag type is guaranteed to be read/written atomically with respect to signal delivery." },
        { t: "code", c:
`volatile sig_atomic_t got_signal = 0;

void handler(int sig) { got_signal = 1; }  // just set flag

int main() {
    // ... register handler ...
    while (1) {
        if (got_signal) { got_signal = 0; /* handle it */ }
        // ... normal work ...
    }
}` },
      ]},
      { heading: "Nonlocal Jumps", icon: "🔀", color: "amber", blocks: [
        { t: "code", label: "setjmp/longjmp — goto across function boundaries:", c:
`#include <setjmp.h>
jmp_buf env;

void deep_function() {
    // ... something goes wrong ...
    longjmp(env, 42);    // jump back to setjmp site, return value=42
    // code after longjmp NEVER executes
}

int main() {
    int val = setjmp(env);  // saves CPU state; returns 0 first time
    if (val == 0) {
        deep_function();    // may longjmp back here
    } else {
        printf("recovered with code %d\n", val);  // val=42
    }
}` },
        { t: "warn", items: [
          "SIGKILL(9) and SIGSTOP(19): cannot be caught, blocked, or ignored. Period.",
          "Signals NOT queued: 5 SIGINTs while SIGINT blocked → only 1 delivered on unblock.",
          "printf() in handler is UNSAFE — uses global buffer, can deadlock if interrupted.",
          "Use siglongjmp/sigsetjmp (not longjmp/setjmp) from signal handlers — restores signal mask.",
          "After fork(): child inherits handlers + mask. After exec(): handlers reset to SIG_DFL.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 19
  {
    number: 19, short: "I/O",
    title: "Topic 19 – Input/Output & Standard I/O",
    overview: "Unix I/O uses integer file descriptors — 0=stdin, 1=stdout, 2=stderr. System calls (read/write/open/close) are unbuffered. stdio (FILE*) adds a user-space buffer. Buffering mode depends on whether the output is a terminal or a file.",
    sections: [
      { heading: "Unix I/O (Kernel Level)", icon: "📁", color: "indigo", blocks: [
        { t: "table", h: ["Syscall", "Signature", "Returns", "Notes"], r: [
          ["open", "open(path, flags, mode)", "fd or -1", "O_RDONLY/WRONLY/RDWR/CREAT/TRUNC"],
          ["read", "read(fd, buf, n)", "bytes read, 0=EOF, -1=err", "May be less than n"],
          ["write", "write(fd, buf, n)", "bytes written or -1", "May be less than n"],
          ["close", "close(fd)", "0 or -1", "Releases fd slot"],
          ["lseek", "lseek(fd, offset, whence)", "new offset or -1", "SEEK_SET/CUR/END"],
          ["stat", "stat(path, &sb)", "0 or -1", "Get file metadata"],
          ["dup2", "dup2(oldfd, newfd)", "newfd or -1", "Redirect I/O"],
        ]},
        { t: "code", label: "Robust read loop (handles partial reads):", c:
`ssize_t readn(int fd, void *buf, size_t n) {
    size_t remaining = n;
    char *p = buf;
    while (remaining > 0) {
        ssize_t r = read(fd, p, remaining);
        if (r < 0)  return -1;   // error
        if (r == 0) break;       // EOF
        p += r;
        remaining -= r;
    }
    return n - remaining;
}` },
      ]},
      { heading: "stdio Buffering & Pipes", icon: "📜", color: "violet", blocks: [
        { t: "dia", label: "Buffering modes:", c:
`_IOFBF (fully buffered):
  Data held in buffer until full or fflush()
  Default for regular files

_IOLBF (line buffered):
  Flushed on newline character or full buffer
  Default for stdout when connected to a terminal

_IONBF (unbuffered):
  Every write goes immediately to kernel
  Default for stderr

Consequence: if you redirect stdout to a file, printf() becomes
fully buffered — output may not appear until program exits!
Use fflush(stdout) or setvbuf(stdout, NULL, _IONBF, 0)` },
        { t: "code", label: "Pipe between parent and child:", c:
`int pfd[2];
pipe(pfd);          // pfd[0]=read, pfd[1]=write

pid_t pid = fork();
if (pid == 0) {     // child: reader
    close(pfd[1]);  // MUST close write end in child
    char buf[128];
    int n = read(pfd[0], buf, sizeof(buf));
    close(pfd[0]);
    exit(0);
} else {            // parent: writer
    close(pfd[0]);  // MUST close read end in parent
    write(pfd[1], "hello\n", 6);
    close(pfd[1]);  // close write end → child sees EOF
    wait(NULL);
}` },
        { t: "warn", items: [
          "printf() buffered — output may not appear immediately. fflush(stdout) forces it.",
          "read() may return LESS than n. Always loop until full amount read.",
          "Forget to close write end of pipe in parent → child never sees EOF → hangs forever.",
          "stdout is line-buffered to terminal, fully-buffered when redirected to file.",
          "fgets() includes the '\\n'. Strip with: buf[strcspn(buf, \"\\n\")] = 0.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 20
  {
    number: 20, short: "Virtual Memory",
    title: "Topic 20 – Virtual Memory & Address Translation",
    overview: "Every process sees a private virtual address space. The CPU's MMU translates virtual→physical addresses using page tables in memory. The TLB caches recent translations for speed. A page fault occurs when a PTE's present bit is 0 — the OS loads the page and retries.",
    sections: [
      { heading: "Pages & Page Tables", icon: "📄", color: "indigo", blocks: [
        { t: "dia", label: "x86-64 4-level page table walk:", c:
`Virtual Address (48 bits used):
┌──────────┬──────────┬──────────┬──────────┬────────────┐
│ PML4 idx │ PDPT idx │  PD idx  │  PT idx  │   Offset   │
│  9 bits  │  9 bits  │  9 bits  │  9 bits  │  12 bits   │
└──────────┴──────────┴──────────┴──────────┴────────────┘

CR3 register
    │
    └──→ PML4 table [PML4 idx]
              │
              └──→ PDPT table [PDPT idx]
                        │
                        └──→ PD table [PD idx]
                                  │
                                  └──→ PT table [PT idx]
                                            │
                                           PTE
                                            │
                          Physical Addr = PTE.PFN | Offset` },
        { t: "p", c: "Each level is itself a 4KB page containing 512 × 8-byte entries. The VPN (virtual page number) is split into 4 × 9-bit chunks — one index per level. Without the TLB, every memory access requires 4 DRAM reads just to translate the address." },
        { t: "dia", label: "Page Table Entry (PTE) bit fields:", c:
`Bits 63-12: Physical Frame Number (PFN)
Bit  11:    (available)
Bit   7:    Page Size (PS): 0=4KB, 1=2MB/1GB huge page
Bit   6:    Dirty (D): set when page was written
Bit   5:    Accessed (A): set when page was read or written
Bit   4:    Cache Disable
Bit   3:    Write Through
Bit   2:    User/Supervisor (U): 0=kernel only, 1=user accessible
Bit   1:    Read/Write (W): 0=read-only, 1=writable
Bit   0:    Present (P): 0=page fault on access, 1=in RAM` },
      ]},
      { heading: "TLB & Page Faults", icon: "⚡", color: "violet", blocks: [
        { t: "dia", label: "Address translation with TLB:", c:
`CPU generates VA
        │
        ▼
   [TLB lookup with VPN]
        │
   ┌────┴────┐
   Hit       Miss
   │         │
   │    [Page table walk: 4 memory reads]
   │         │
   └────┬────┘
        │
   PTE found?
   ┌────┴────┐
  P=1       P=0
   │         │
   PA       [Page fault #PF]
             │
          OS handler:
          1. Find a free frame
          2. Load page from disk/swap
          3. Set PTE.P=1, set PFN
          4. Return → CPU retries instruction` },
        { t: "p", c: "Copy-on-write (COW): after fork(), parent and child share physical pages mapped read-only. The first write to a shared page triggers a page fault. The OS detects COW, allocates a new frame, copies the page, remaps it as writable. This makes fork() fast (no actual copying)." },
      ]},
      { heading: "Protection & Demand Paging", icon: "🛡️", color: "amber", blocks: [
        { t: "table", h: ["Protection scenario", "What happens"], r: [
          ["Access with P=0", "Page fault #PF. OS loads page. Instruction retried."],
          ["Write to W=0 page", "Page fault #PF. OS sends SIGSEGV to process."],
          ["User code accesses U=0 page", "General protection fault #GP"],
          ["Execute from NX page", "Page fault #PF (NX bit in PTE)"],
          ["COW write", "Page fault #PF → OS copies page → remaps R/W"],
        ]},
        { t: "warn", items: [
          "TLB miss ≠ page fault. TLB miss → hardware page table walk. Page fault → P=0 → OS handler.",
          "VPO (page offset) = low 12 bits for 4KB pages. These bits pass unchanged to physical address.",
          "COW write faults even though page IS present (P=1) — it's read-only (W=0).",
          "4-level page table walk = 4 DRAM accesses without TLB. TLB is critical for speed.",
          "After exec(): new page table installed. Old mappings gone. Code/stack re-initialized.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 21
  {
    number: 21, short: "Concurrent Programming",
    title: "Topic 21 – Concurrent Programming",
    overview: "Concurrent programs have multiple execution flows active at overlapping times. Three approaches: processes (isolated), threads (shared memory), I/O multiplexing (single thread, event loop). Thread safety and reentrancy are distinct properties.",
    sections: [
      { heading: "Concurrency Models", icon: "🔀", color: "indigo", blocks: [
        { t: "dia", label: "Three approaches:", c:
`1. Process-based:
   fork() per client. Strong isolation. IPC = pipes/sockets (overhead).
   Good when: isolation critical, existing programs, OS does scheduling.

2. Thread-based:
   pthread_create() per client. Shared memory, easy IPC.
   Need synchronization. Good for CPU-bound parallel work.

3. I/O multiplexing (event-driven):
   Single process, event loop with epoll()/select().
   No synchronization needed. Complex control flow.
   Good for: I/O-bound servers with many connections (nginx model).

Concurrency ≠ Parallelism:
  Concurrent: multiple flows, may INTERLEAVE on 1 core
  Parallel:   multiple flows execute SIMULTANEOUSLY (need multiple cores)` },
      ]},
      { heading: "Pthreads & Shared State", icon: "🧵", color: "violet", blocks: [
        { t: "code", label: "Basic thread lifecycle:", c:
`#include <pthread.h>

void *worker(void *arg) {
    int id = *(int *)arg;
    printf("Thread %d working\n", id);
    return (void *)(intptr_t)(id * 2);   // return value
}

int main() {
    pthread_t tid;
    int arg = 42;
    pthread_create(&tid, NULL, worker, &arg);
    // ... do other work ...
    void *retval;
    pthread_join(tid, &retval);   // wait + get return value
    printf("returned: %ld\n", (intptr_t)retval);
}` },
        { t: "table", h: ["Function", "Purpose"], r: [
          ["pthread_create(&tid, attr, fn, arg)", "Spawn thread"],
          ["pthread_join(tid, &ret)", "Wait for thread, get return value"],
          ["pthread_detach(tid)", "Auto-cleanup on exit (no join needed)"],
          ["pthread_exit(ret)", "Exit current thread"],
          ["pthread_self()", "Get own thread ID"],
          ["pthread_cancel(tid)", "Request cancellation"],
        ]},
      ]},
      { heading: "Thread Safety & Reentrancy", icon: "✅", color: "amber", blocks: [
        { t: "p", c: "Thread-safe: a function produces correct results when called concurrently from multiple threads. Reentrant: a stronger guarantee — safe even if interrupted mid-execution and called again (no shared state at all, uses only local variables). Reentrant implies thread-safe, but not vice versa." },
        { t: "table", h: ["Function", "Thread-safe?", "Reentrant?", "Fix"], r: [
          ["rand()", "NO", "NO", "rand_r(seed) or thread-local seed"],
          ["strtok()", "NO", "NO", "strtok_r(str, delim, &saveptr)"],
          ["localtime()", "NO", "NO", "localtime_r(timer, result)"],
          ["malloc()/free()", "YES (glibc)", "NO", "uses internal lock"],
          ["printf()", "YES (glibc)", "NO", "uses FILE lock"],
          ["memcpy()", "YES", "YES", "pure local ops"],
          ["strlen()", "YES", "YES", "read-only, no shared state"],
        ]},
        { t: "warn", items: [
          "Concurrent ≠ parallel. Single core can be concurrent (interleaved), not parallel.",
          "Reentrant ⊂ thread-safe. Adding a mutex makes something thread-safe but NOT reentrant.",
          "pthread_join is required unless thread is detached. Otherwise zombie threads accumulate.",
          "select() FD_SETSIZE = 1024 limit. epoll has no limit. Use epoll for high concurrency.",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 22
  {
    number: 22, short: "Parallelism & Sync",
    title: "Topic 22 – Parallelism & Synchronization",
    overview: "Synchronization primitives protect shared data. Mutex = binary lock. Semaphore = counting lock. Condition variable = wait for condition (ALWAYS use while, not if). Amdahl's Law: the serial fraction of code hard-limits the maximum achievable speedup.",
    sections: [
      { heading: "Mutex, Semaphore & Spinlock", icon: "🔒", color: "indigo", blocks: [
        { t: "code", label: "Mutex usage pattern:", c:
`pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
int shared_counter = 0;

void increment() {
    pthread_mutex_lock(&lock);   // blocks if locked
    shared_counter++;            // critical section
    pthread_mutex_unlock(&lock); // releases
}

// Trylock (non-blocking attempt):
if (pthread_mutex_trylock(&lock) == 0) {
    // got it
    pthread_mutex_unlock(&lock);
} else {
    // EBUSY: already locked, do something else
}` },
        { t: "table", h: ["Primitive", "Function", "Behavior"], r: [
          ["Mutex", "pthread_mutex_lock/unlock", "Binary: 0 or 1. Blocks on lock."],
          ["Semaphore", "sem_wait / sem_post", "Counter. Blocks when 0."],
          ["Spinlock", "pthread_spin_lock/unlock", "Busy-waits. Good for short sections."],
          ["RW Lock", "pthread_rwlock_rdlock / wrlock", "Multiple readers OR one writer"],
        ]},
      ]},
      { heading: "Condition Variables", icon: "⏳", color: "violet", blocks: [
        { t: "p", c: "Condition variables solve the 'wait until X is true' problem. CRITICAL: always use a while loop, never if. Spurious wakeups (the OS waking a thread without pthread_cond_signal) are allowed by POSIX. Always re-check the condition after waking." },
        { t: "code", label: "Producer-consumer with condition variable:", c:
`pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t  nonempty = PTHREAD_COND_INITIALIZER;
pthread_cond_t  nonfull  = PTHREAD_COND_INITIALIZER;
int buf[N], head=0, tail=0, count=0;

void produce(int item) {
    pthread_mutex_lock(&lock);
    while (count == N)                          // WHILE not if!
        pthread_cond_wait(&nonfull, &lock);     // atomically release + sleep
    buf[tail++ % N] = item;  count++;
    pthread_cond_signal(&nonempty);
    pthread_mutex_unlock(&lock);
}

void *consume() {
    pthread_mutex_lock(&lock);
    while (count == 0)                          // WHILE not if!
        pthread_cond_wait(&nonempty, &lock);
    int item = buf[head++ % N];  count--;
    pthread_cond_signal(&nonfull);
    pthread_mutex_unlock(&lock);
    return item;
}` },
      ]},
      { heading: "Deadlock & Amdahl's Law", icon: "📊", color: "amber", blocks: [
        { t: "p", c: "Deadlock requires all 4 conditions simultaneously: mutual exclusion, hold-and-wait, no preemption, circular wait. Break ANY one to prevent deadlock. The easiest: enforce a global lock ordering (never acquire lock B while holding lock A if anywhere you also acquire A while holding B)." },
        { t: "dia", label: "Amdahl's Law — speedup vs cores:", c:
`Speedup S(N) = 1 / (f + (1-f)/N)
f = serial fraction, N = number of processors

            N=1    N=2    N=4    N=8    N=16   N=∞
f=0.5 (50%)  1×    1.33×  1.60×  1.78×  1.88×   2×  ← hard wall
f=0.1 (10%)  1×    1.82×  3.08×  4.71×  6.40×  10×
f=0.01 (1%)  1×    1.98×  3.88×  7.41× 13.91× 100×

→ Even 1% serial code limits you to 100× max, regardless of cores.
→ The serial fraction dominates at high core counts.` },
        { t: "warn", items: [
          "ALWAYS use while() not if() with pthread_cond_wait. Spurious wakeups are real.",
          "pthread_cond_wait must be called with mutex LOCKED. Releases atomically during sleep.",
          "Amdahl example — 8 cores, 20% serial: S = 1/(0.2 + 0.8/8) = 1/0.3 = 3.33×",
          "False sharing: two threads write different vars in same 64B cache line → cache ping-pong.",
          "sem_post() is async-signal-safe. pthread_mutex_unlock() is NOT (unsafe in signal handlers).",
        ]},
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────── TOPIC 23
  {
    number: 23, short: "Virtual Machines",
    title: "Topic 23 – Virtual Machines",
    overview: "A virtual machine runs a complete guest OS on emulated hardware. The hypervisor (VMM) manages VMs. Type 1 runs on bare metal (faster, data centers). Type 2 runs on a host OS (easier, development). Intel VT-x and AMD-V provide hardware acceleration.",
    sections: [
      { heading: "Hypervisor Types", icon: "🖥️", color: "indigo", blocks: [
        { t: "dia", label: "Type 1 vs Type 2 hypervisors:", c:
`Type 1 (Bare-metal):            Type 2 (Hosted):
┌──────┬──────┬──────┐          ┌──────┬──────┬──────┐
│ VM1  │ VM2  │ VM3  │          │ VM1  │ VM2  │ VM3  │
├──────┴──────┴──────┤          ├──────┴──────┴──────┤
│    Hypervisor      │          │    Hypervisor       │
├────────────────────┤          ├────────────────────┤
│     Hardware       │          │    Host OS          │
└────────────────────┘          ├────────────────────┤
                                │    Hardware         │
                                └────────────────────┘

Type 1 examples: VMware ESXi, Hyper-V, KVM (Linux kernel IS hypervisor)
Type 2 examples: VirtualBox, VMware Workstation, Parallels

Type 1: lower overhead, better isolation, production/data centers
Type 2: easier install, good for dev/test, worse performance` },
      ]},
      { heading: "Virtualization Techniques", icon: "⚙️", color: "violet", blocks: [
        { t: "table", h: ["Technique", "Guest OS modified?", "Mechanism", "Performance"], r: [
          ["Full virt (binary trans.)", "NO", "Rewrite privileged instructions", "Moderate"],
          ["Full virt (HW-assisted)", "NO", "VT-x/AMD-V traps", "Good"],
          ["Paravirtualization", "YES (hypercalls)", "Guest calls hypervisor explicitly", "Good"],
          ["Passthrough (VFIO)", "NO", "Direct hardware access", "Native"],
        ]},
        { t: "dia", label: "Hardware-assisted virtualization (Intel VT-x):", c:
`Guest runs in VMX non-root mode (ring 0 inside VM)
        │
   Guest executes privileged instruction (e.g. write to CR3)
        │
        ▼
   VM EXIT: hardware saves guest state to VMCS
        │
        ▼
   Hypervisor runs in VMX root mode
   Handles the privileged operation (emulates or delegates)
        │
        ▼
   VMRESUME: restore guest state from VMCS, return to guest

VMCS (VM Control Structure): per-VM data structure storing
  guest state, host state, execution controls, exit info.` },
      ]},
      { heading: "Memory & I/O Virtualization", icon: "🗺️", color: "amber", blocks: [
        { t: "p", c: "The key challenge: guest OS thinks it has physical memory starting at 0. But the hypervisor also uses physical memory. Solution: two levels of address translation." },
        { t: "dia", label: "Two-level page table translation:", c:
`Guest virtual → guest physical  (guest's own page tables)
Guest physical → host physical  (EPT/NPT hardware support)

Without EPT/NPT (shadow page tables, pre-2006):
  Hypervisor manually maintains guest-VA → host-PA mapping
  Every guest page table modification → VM exit → expensive

With EPT (Intel) / NPT (AMD):
  Hardware walks BOTH levels automatically
  Much fewer VM exits for memory operations` },
        { t: "warn", items: [
          "KVM = TYPE 1. Linux kernel acts as hypervisor. NOT type 2 even though Linux is the host.",
          "VirtualBox/VMware Workstation = type 2. VMware ESXi = type 1.",
          "Full virtualization: guest NOT modified. Paravirtualization: guest IS modified.",
          "VM exit is expensive: hundreds to thousands of cycles each. Minimize privileged ops.",
          "EPT/NPT: TLB miss is more expensive in VM than native (two table levels to walk).",
          "Snapshot ≠ backup. Deleting base disk breaks all snapshots dependent on it.",
        ]},
      ]},
    ],
  },
];

export default function StudyPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const topic = TOPICS[selected];

  function selectTopic(i: number) {
    setSelected(i);
    setOpen({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggle(key: string) {
    setOpen(p => ({ ...p, [key]: !(p[key] ?? true) }));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 bg-slate-950/95 backdrop-blur z-20">
        <button onClick={() => navigate("/")} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <span className="font-semibold text-sm text-slate-200">CS231 Study Guide</span>
        <span className="text-slate-600 hidden sm:inline">·</span>
        <span className="text-slate-500 text-xs hidden sm:inline">23 Topics · Spring 2026</span>
      </header>

      <div className="border-b border-slate-800 bg-slate-900/60 sticky top-[53px] z-10">
        <div className="overflow-x-auto">
          <div className="flex px-4 py-2 gap-1.5 min-w-max">
            {TOPICS.map((t, i) => (
              <button key={i} onClick={() => selectTopic(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selected === i ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}>
                {t.number}. {t.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 gap-3">
            <span className="text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2.5 py-1 rounded-full flex-shrink-0">
              Topic {topic.number} / 23
            </span>
            <div className="flex items-center gap-4 ml-auto">
              {selected > 0 && <button onClick={() => selectTopic(selected - 1)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Prev</button>}
              {selected < TOPICS.length - 1 && <button onClick={() => selectTopic(selected + 1)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Next →</button>}
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{topic.title}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{topic.overview}</p>
        </div>

        <div className="space-y-3">
          {topic.sections.map((sec, si) => {
            const key = `${selected}-${si}`;
            const isOpen = open[key] ?? true;
            const col = C[sec.color as keyof typeof C] ?? C.indigo;
            return (
              <div key={si} className={`border rounded-xl overflow-hidden ${col.card}`}>
                <button onClick={() => toggle(key)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{sec.icon}</span>
                    <span className={`font-semibold text-sm ${col.badge}`}>{sec.heading}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${col.ch} ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    {sec.blocks.map((b, bi) => <Block key={bi} b={b} dot={col.dot} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
          <button onClick={() => navigate("/exam")}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm">
            <Star className="w-4 h-4" /> Test Yourself
          </button>
          {selected < TOPICS.length - 1 && (
            <button onClick={() => selectTopic(selected + 1)}
              className="flex-1 flex items-center justify-center gap-2 border border-slate-700 text-slate-300 hover:bg-slate-800 py-2.5 rounded-xl transition-all text-sm">
              Next Topic <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
