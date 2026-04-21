import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronRight, ChevronDown, Code2, AlertTriangle, Lightbulb, Star } from "lucide-react";

interface Section {
  heading: string;
  color: string;
  icon: string;
  items: string[];
}

interface TopicData {
  number: number;
  short: string;
  title: string;
  overview: string;
  sections: Section[];
}

const TOPICS: TopicData[] = [
  {
    number: 1,
    short: "Binary & Byte Ordering",
    title: "Topic 1 – Binary Representation & Byte Ordering",
    overview:
      "Computers store all data as binary (base-2). A byte is 8 bits and is the smallest addressable unit in memory. Understanding number bases and how multi-byte values are laid out in memory is fundamental to low-level programming.",
    sections: [
      {
        heading: "Number Systems",
        color: "indigo",
        icon: "🔢",
        items: [
          "Binary (base-2): digits 0–1. E.g. 11101101₂ = 237₁₀",
          "Hexadecimal (base-16): digits 0–9, A–F. 1 hex digit = 4 bits (nibble). 0xED = 237₁₀",
          "Octal (base-8): digits 0–7. Rarely used in modern code.",
          "Conversion: repeatedly divide by target base, collect remainders bottom-up.",
          "1 byte = 8 bits = 2 hex digits. A 32-bit int = 8 hex digits.",
        ],
      },
      {
        heading: "Byte-Oriented Memory",
        color: "violet",
        icon: "🧠",
        items: [
          "Each memory address holds exactly 1 byte. CPU forms addresses of individual bytes.",
          "Word size: the natural data unit of the CPU. x86-64 has a 64-bit (8-byte) word.",
          "Word size determines max addressable memory: 64-bit → 2^64 bytes (theoretical).",
          "A 32-bit CPU can address at most 2^32 = 4 GB of RAM directly.",
          "Larger word sizes also mean wider registers and arithmetic operations.",
        ],
      },
      {
        heading: "Endianness",
        color: "amber",
        icon: "🔄",
        items: [
          "Multi-byte values stored across consecutive addresses in two ways:",
          "Big-endian: most significant byte at lowest address. E.g. 0x12345678 at 0x100 → [0x12, 0x34, 0x56, 0x78]",
          "Little-endian: least significant byte at lowest address. x86 is little-endian. 0x12345678 at 0x100 → [0x78, 0x56, 0x34, 0x12]",
          "Network byte order = big-endian. Use htonl()/ntohl() when sending integers over network.",
          "Detect endianness in C: union { int i; char c[4]; } u = {1}; if (u.c[0] == 1) → little-endian.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "Little-endian: address 0x100 holds the LEAST significant byte, not the first digit.",
          "Bit 7 of an 8-bit value is the MSB (leftmost in standard notation).",
          "A nibble = 4 bits = 1 hex digit. A QWORD = 8 bytes = 64 bits.",
          "64-bit processors write 32-bit results to EAX and zero-extend the upper 32 bits of RAX.",
        ],
      },
    ],
  },
  {
    number: 2,
    short: "Integers & Arithmetic",
    title: "Topic 2 – Encoding Integers & Arithmetic",
    overview:
      "Modern CPUs represent signed integers using two's complement, which allows the same hardware adder to handle both signed and unsigned addition. Understanding overflow, sign extension, and shift operations is critical for low-level programming.",
    sections: [
      {
        heading: "Two's Complement",
        color: "indigo",
        icon: "➕",
        items: [
          "To negate: invert all bits (one's complement), then add 1.",
          "8-bit signed range: –128 to +127. Formula: –2^(n-1) to 2^(n-1)–1.",
          "One more negative value than positive because 0 is positive: –128 has no positive counterpart.",
          "Two's complement of 0 is 0 (flip all bits → 0xFF, add 1 → overflow back to 0x00).",
          "Benefit: addition/subtraction hardware is identical for signed and unsigned.",
        ],
      },
      {
        heading: "Overflow & Flags",
        color: "orange",
        icon: "🚨",
        items: [
          "Unsigned overflow: result wraps modulo 2^n. Detected by Carry Flag (CF).",
          "Signed overflow: result exceeds the representable range. Detected by Overflow Flag (OF).",
          "Unsigned 8-bit: 255 + 1 = 0 (CF=1). Signed 8-bit: 127 + 1 = –128 (OF=1).",
          "Casting negative signed int to unsigned: value becomes 2^n + original. E.g. (uint8_t)(-1) = 255.",
          "Zero Flag (ZF): set when result is zero. Sign Flag (SF): set when result is negative.",
        ],
      },
      {
        heading: "Sign & Zero Extension",
        color: "violet",
        icon: "↔️",
        items: [
          "Sign extension: replicate the MSB to fill the wider register. Needed for signed values.",
          "8-bit 0b10110011 (–77) sign-extended to 16-bit: 0b1111111110110011.",
          "Zero extension: fill upper bits with 0. Used for unsigned values.",
          "x86-64: writing to EAX (32-bit) automatically zero-extends into RAX.",
          "MOVSX = move with sign extension. MOVZX = move with zero extension.",
        ],
      },
      {
        heading: "Multiplication, Division & Shifts",
        color: "emerald",
        icon: "✖️",
        items: [
          "MUL (unsigned) / IMUL (signed): implicit operand is RAX; result in RDX:RAX (128-bit).",
          "DIV / IDIV: divide RDX:RAX by operand; quotient in RAX, remainder in RDX.",
          "Division by zero → #DE exception (Divide Error, interrupt 0).",
          "SHL/SHR: logical shift left/right (fills with 0). Multiply/divide by powers of 2.",
          "SAR: arithmetic shift right — preserves sign bit. –8 SAR 1 = –4.",
          "In C: >> on signed types is implementation-defined (usually arithmetic on x86).",
        ],
      },
    ],
  },
  {
    number: 3,
    short: "Floating Point",
    title: "Topic 3 – Encoding Fractional Numbers (Float/Double)",
    overview:
      "IEEE 754 is the standard for floating-point arithmetic. Understanding its structure explains why 0.1 + 0.2 ≠ 0.3 in computers and how special values like NaN and infinity work.",
    sections: [
      {
        heading: "IEEE 754 Format",
        color: "indigo",
        icon: "🔬",
        items: [
          "float (32-bit): 1 sign bit, 8 exponent bits, 23 mantissa bits.",
          "double (64-bit): 1 sign bit, 11 exponent bits, 52 mantissa bits.",
          "Value = (–1)^sign × 1.mantissa × 2^(exponent – bias).",
          "Bias: 127 for float, 1023 for double. Stored exponent = actual exponent + bias.",
          "Mantissa is stored without the leading 1 (implicit leading 1 for normalized numbers).",
        ],
      },
      {
        heading: "Special Values",
        color: "violet",
        icon: "⭐",
        items: [
          "+/– Zero: all bits 0 (or sign=1, rest 0). Two zeros: +0 and –0 (compare equal).",
          "Denormalized: exponent field = 0. No implicit leading 1. Allows gradual underflow.",
          "Infinity: exponent all 1s, mantissa = 0. Result of overflow or 1.0/0.0.",
          "NaN (Not a Number): exponent all 1s, mantissa ≠ 0. Result of 0/0, sqrt(–1), etc.",
          "NaN ≠ NaN is always true — use isnan() to check.",
        ],
      },
      {
        heading: "Precision & Rounding",
        color: "amber",
        icon: "📏",
        items: [
          "float has ~7 decimal digits of precision; double ~15–16 digits.",
          "0.1 cannot be represented exactly in binary — stored as closest approximation.",
          "Rounding modes: round-to-nearest-even (default), round-up, round-down, round-to-zero.",
          "Associativity fails: (a+b)+c ≠ a+(b+c) due to rounding at each step.",
          "Never compare floats with ==; use |a – b| < epsilon instead.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "Exponent 0 = denormalized (no implicit 1). Exponent all-1s = Inf/NaN.",
          "Casting float→int truncates (round-toward-zero), not rounds.",
          "int can represent exact integers float cannot (e.g. large primes > 2^24).",
          "Multiplying by 0.5 is safe (exact); dividing by 2.0 may introduce rounding.",
        ],
      },
    ],
  },
  {
    number: 4,
    short: "x86 Registers & CPU",
    title: "Topic 4 – x86/x64 Processors & Registers",
    overview:
      "x86-64 CPUs have 16 general-purpose 64-bit registers, a flags register, and an instruction pointer. Understanding register naming and the condition flags is essential for reading and writing assembly.",
    sections: [
      {
        heading: "General-Purpose Registers",
        color: "indigo",
        icon: "🗂️",
        items: [
          "64-bit: RAX, RBX, RCX, RDX, RSI, RDI, RBP, RSP, R8–R15.",
          "32-bit lower half: EAX, EBX, ECX, EDX, ESI, EDI, EBP, ESP, R8D–R15D.",
          "16-bit: AX, BX, CX, DX, SI, DI, BP, SP, R8W–R15W.",
          "8-bit low: AL, BL, CL, DL, SIL, DIL, BPL, SPL, R8B–R15B.",
          "AH, BH, CH, DH = high byte of 16-bit AX/BX/CX/DX (legacy).",
          "Writing EAX zero-extends to RAX; writing AX or AL does NOT zero-extend upper bits.",
        ],
      },
      {
        heading: "Special Registers",
        color: "violet",
        icon: "🎯",
        items: [
          "RSP: stack pointer — always points to top of stack (lowest used address).",
          "RBP: base/frame pointer — optional, used to establish stack frame.",
          "RIP: instruction pointer — address of next instruction to execute.",
          "RFLAGS: condition flags register. Individual bits hold CF, ZF, SF, OF, PF, DF.",
          "Segment registers (CS, DS, SS, ES, FS, GS) — mostly legacy in 64-bit mode; FS/GS used for thread-local storage.",
        ],
      },
      {
        heading: "Condition Flags",
        color: "amber",
        icon: "🚩",
        items: [
          "CF (Carry Flag): unsigned overflow or borrow.",
          "ZF (Zero Flag): result was zero.",
          "SF (Sign Flag): result was negative (MSB = 1).",
          "OF (Overflow Flag): signed overflow.",
          "PF (Parity Flag): result has even number of 1-bits.",
          "DF (Direction Flag): controls string instruction direction (CLD clears, STD sets).",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "Writing to EAX clears upper 32 bits of RAX. Writing to AX does not.",
          "RCX = loop counter register (LOOP instruction decrements RCX).",
          "RDI = first argument, RSI = second (System V ABI).",
          "RFLAGS is not directly named in NASM — use pushfq/popfq to access it.",
        ],
      },
    ],
  },
  {
    number: 5,
    short: "Assembly & Arithmetic",
    title: "Topic 5 – Assembly Language & Arithmetic",
    overview:
      "NASM uses Intel syntax: destination first, then source. Assembly instructions map nearly 1-to-1 to machine code. Mastering arithmetic and bitwise instructions is the core of low-level programming.",
    sections: [
      {
        heading: "Basic Instructions",
        color: "indigo",
        icon: "⚙️",
        items: [
          "MOV dst, src — copies src into dst. Does not set flags.",
          "ADD dst, src — dst = dst + src. Sets CF, ZF, SF, OF.",
          "SUB dst, src — dst = dst – src. Sets flags.",
          "INC dst / DEC dst — increment/decrement by 1. Does NOT set CF.",
          "NEG dst — two's complement negation. NEG is equivalent to (NOT dst) + 1.",
          "CMP a, b — computes a–b and sets flags but discards result. Used before jumps.",
        ],
      },
      {
        heading: "Multiplication & Division",
        color: "violet",
        icon: "✖️",
        items: [
          "MUL src — unsigned multiply RAX × src → RDX:RAX.",
          "IMUL src — signed multiply. IMUL has 2-operand and 3-operand forms: IMUL dst, src, imm.",
          "DIV src — unsigned divide RDX:RAX ÷ src → quotient in RAX, remainder in RDX.",
          "IDIV — signed version. Set RDX = 0 (or sign-extend) before DIV/IDIV.",
          "Multiply by 10 without MUL: LEA rax, [rax + rax*4]; SHL rax, 1 (= rax × 10).",
        ],
      },
      {
        heading: "Bitwise & Shift",
        color: "emerald",
        icon: "🔧",
        items: [
          "AND dst, src — bitwise AND. Useful to mask bits: AND al, 0x0F keeps low nibble.",
          "OR dst, src — bitwise OR. Sets bits.",
          "XOR dst, src — bitwise XOR. XOR reg, reg zeros a register cheaply (no memory).",
          "NOT dst — bitwise NOT (one's complement).",
          "SHL/SHR by n — shift left/right by n bits (fill with 0). SHL multiplies by 2^n.",
          "SAR — arithmetic shift right, preserves sign bit.",
          "ROL/ROR — rotate left/right (bits wrap around).",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "NASM: destination operand is always FIRST (Intel syntax), unlike AT&T where it's last.",
          "INC/DEC do not modify CF — important for multi-precision arithmetic.",
          "XOR reg, reg is faster than MOV reg, 0 and encodes smaller.",
          "TEST dst, src = AND without storing result. Commonly used: TEST rax, rax; jz label.",
        ],
      },
    ],
  },
  {
    number: 6,
    short: "Memory Addressing & Jumps",
    title: "Topic 6 – Memory Addressing, MOV, LEA, Jumps, Loops",
    overview:
      "x86 has powerful memory addressing modes. LEA is a versatile arithmetic instruction that looks like a load but never touches memory. Conditional jumps form the basis of all control flow.",
    sections: [
      {
        heading: "Addressing Modes",
        color: "indigo",
        icon: "📍",
        items: [
          "[reg] — memory at address in register. E.g. MOV rax, [rbx]",
          "[reg + disp] — register + constant offset. E.g. MOV rax, [rbp – 8]",
          "[base + index*scale + disp] — full form. Scale ∈ {1, 2, 4, 8}.",
          "Example: MOV eax, [rcx + rdx*4 + 8] — accesses int array element.",
          "Operand size must match: BYTE PTR, WORD PTR, DWORD PTR, QWORD PTR.",
        ],
      },
      {
        heading: "LEA vs MOV",
        color: "violet",
        icon: "🔗",
        items: [
          "LEA dst, [expr] — Load Effective Address. Computes the address, stores it. No memory access.",
          "MOV dst, [expr] — actually reads from memory at that address.",
          "LEA is used for address arithmetic: LEA rax, [rbx + rcx*4] sets rax = rbx + rcx*4.",
          "LEA can multiply by 2, 3, 4, 5, 8, 9 efficiently: LEA rax, [rax + rax*2] = rax × 3.",
          "LEA does not affect flags, unlike ADD/IMUL.",
        ],
      },
      {
        heading: "Conditional Jumps",
        color: "amber",
        icon: "↪️",
        items: [
          "JMP label — unconditional jump.",
          "JE/JZ — jump if equal / zero (ZF=1).",
          "JNE/JNZ — jump if not equal / not zero (ZF=0).",
          "JL/JNGE — signed less than (SF≠OF).",
          "JG/JNLE — signed greater than (ZF=0 and SF=OF).",
          "JB/JC — unsigned below (CF=1). JA — unsigned above (CF=0 and ZF=0).",
          "Always CMP or TEST before a conditional jump.",
        ],
      },
      {
        heading: "Loops",
        color: "emerald",
        icon: "🔁",
        items: [
          "LOOP label — decrements RCX; jumps if RCX ≠ 0. Use ECX in 32-bit mode.",
          "LOOPE/LOOPZ — also requires ZF=1 to loop.",
          "LOOPNE/LOOPNZ — also requires ZF=0 to loop.",
          "Modern code avoids LOOP (slow on modern CPUs); prefer DEC + JNZ.",
          "REP MOVSB/MOVSQ — repeat string instruction RCX times (fast memory copy).",
        ],
      },
    ],
  },
  {
    number: 7,
    short: "Stack & Procedures",
    title: "Topic 7 – Stack, Procedures, Stack Frame",
    overview:
      "The call stack stores local variables, saved registers, and return addresses. The System V AMD64 ABI defines how arguments are passed and which registers must be preserved — critical for writing correct functions.",
    sections: [
      {
        heading: "Stack Mechanics",
        color: "indigo",
        icon: "📚",
        items: [
          "Stack grows downward: PUSH decrements RSP by 8, then writes. POP reads, then increments RSP.",
          "RSP always points to the top (lowest address) of the stack.",
          "PUSH rax ≡ SUB rsp, 8 ; MOV [rsp], rax",
          "POP rax ≡ MOV rax, [rsp] ; ADD rsp, 8",
          "Stack must be 16-byte aligned at the point of a CALL instruction (System V ABI).",
        ],
      },
      {
        heading: "CALL & RET",
        color: "violet",
        icon: "📞",
        items: [
          "CALL label ≡ PUSH rip_next ; JMP label — saves next instruction address.",
          "RET ≡ POP rip — restores saved return address into RIP.",
          "RET n — also pops n bytes of arguments from stack (stdcall/Windows ABI).",
          "After CALL, RSP is misaligned by 8 (return address was pushed).",
          "Function must restore RSP to its entry value before RET.",
        ],
      },
      {
        heading: "Stack Frame & ABI",
        color: "amber",
        icon: "🏗️",
        items: [
          "System V AMD64 ABI integer args: RDI, RSI, RDX, RCX, R8, R9 (in order). Extra args on stack.",
          "Return value: RAX (and RDX for large returns).",
          "Callee-saved (must preserve): RBX, RBP, R12–R15.",
          "Caller-saved (can clobber): RAX, RCX, RDX, RSI, RDI, R8–R11.",
          "Stack frame: PUSH RBP; MOV RBP, RSP; SUB RSP, N allocates N bytes of locals.",
          "Stack frame teardown: LEAVE ≡ MOV rsp, rbp ; POP rbp.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "Forgetting to align RSP before CALL to a function that uses SSE/AVX (needs 16-byte alignment).",
          "Windows x64 ABI differs: first 4 args in RCX, RDX, R8, R9 with 32-byte shadow space.",
          "Callee must save RBX if it uses it — otherwise the caller's value is destroyed.",
          "Local variables accessed via negative offsets from RBP (e.g. [rbp–8]).",
        ],
      },
    ],
  },
  {
    number: 8,
    short: "NASM Preprocessor & Macros",
    title: "Topic 8 – NASM Preprocessor & Macros",
    overview:
      "NASM has a powerful macro system that runs at assembly time. Macros enable code reuse, conditional assembly, and readable constant definitions without any runtime overhead.",
    sections: [
      {
        heading: "Constants & Definitions",
        color: "indigo",
        icon: "📌",
        items: [
          "%define NAME value — text substitution (like C #define).",
          "%assign NAME expr — numeric constant (evaluated at assembly time).",
          "EQU: BUFSIZE EQU 256 — assigns a symbol (cannot redefine unlike %assign).",
          "%undef NAME — undefines a macro.",
          "%define can take parameters: %define SQ(x) ((x)*(x))",
        ],
      },
      {
        heading: "Multi-Line Macros",
        color: "violet",
        icon: "🧩",
        items: [
          "%macro NAME nargs / %endmacro — define a multi-line macro with nargs arguments.",
          "Arguments accessed as %1, %2, … inside macro body.",
          "%%label — local label unique to each macro expansion (avoids redefinition).",
          "%macro PRINT 1 — example macro that takes 1 arg.",
          "Macros expand inline — no call overhead; good for small repeated code patterns.",
        ],
      },
      {
        heading: "Conditionals & Includes",
        color: "emerald",
        icon: "🔀",
        items: [
          "%include 'file.asm' — includes another file at assembly time.",
          "%ifdef NAME / %ifndef NAME / %else / %endif — conditional assembly.",
          "%if expr / %elif expr / %else / %endif — numeric conditional.",
          "Used for include guards: %ifndef HEADER_INCLUDED / %define HEADER_INCLUDED",
          "Conditional assembly allows platform-specific code without runtime overhead.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "%define is purely textual — no type checking. Use %assign for numeric values.",
          "%%labels are local per expansion — without %% a label redefined error occurs.",
          "Macro arguments (%1, %2) can be any token including registers or memory operands.",
          "Macros vs procedures: macros inline code (larger binary); procedures have call overhead.",
        ],
      },
    ],
  },
  {
    number: 9,
    short: "STRUC & Alignment",
    title: "Topic 9 – STRUC, ISTRUC, Alignment",
    overview:
      "NASM STRUC defines memory layout templates similar to C structs. Alignment ensures data is accessed efficiently; misaligned accesses cause performance penalties (and faults on some architectures).",
    sections: [
      {
        heading: "STRUC & ISTRUC",
        color: "indigo",
        icon: "🏛️",
        items: [
          "STRUC name / ENDSTRUC — defines field offsets. No memory allocated.",
          ".field: RESB/RESW/RESD/RESQ n — reserves n bytes/words/dwords/qwords.",
          "Field offsets accessible as name.field (e.g. Point.x, Point.y).",
          "ISTRUC name / IEND — instantiates a struct in the data section.",
          "AT name.field, db/dw/dd/dq value — sets the value of each field in ISTRUC.",
        ],
      },
      {
        heading: "Alignment",
        color: "violet",
        icon: "📐",
        items: [
          "Natural alignment: n-byte type should be at an address divisible by n.",
          "int (4 bytes) → address must be multiple of 4. double (8 bytes) → multiple of 8.",
          "ALIGN n — pads to the next multiple-of-n boundary using NOP or zero bytes.",
          "ALIGNB n — same but uses 0 bytes (for data sections).",
          "Misaligned access: allowed on x86 but slower. Fatal on some RISC architectures.",
        ],
      },
      {
        heading: "times Directive",
        color: "amber",
        icon: "🔢",
        items: [
          "times N db 0 — reserves N bytes initialized to 0.",
          "Used for padding structs: times Point_size – ($ – Point) db 0",
          "$ means current address; $$ means start of current section.",
          "times N instruction — repeats an instruction N times inline.",
          "Useful for fixed-size buffers and lookup tables.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "STRUC creates offsets, not data — actual data comes from ISTRUC or DB/RES* in data section.",
          "Without ALIGN, subsequent fields may be misaligned if previous field is odd-sized.",
          "Struct size includes padding — may be larger than sum of field sizes.",
          "C compilers insert padding automatically; NASM structs do not — you must add ALIGN manually.",
        ],
      },
    ],
  },
  {
    number: 10,
    short: "Data Types & Arrays",
    title: "Topic 10 – Basic Data Types & Arrays",
    overview:
      "C provides primitive types with defined size ranges but implementation-defined actual sizes. Arrays are contiguous blocks of memory; pointer arithmetic and indexing are identical operations at the machine level.",
    sections: [
      {
        heading: "C Type Sizes (x86-64 Linux)",
        color: "indigo",
        icon: "📏",
        items: [
          "char: 1 byte (signed or unsigned, implementation-defined).",
          "short: 2 bytes. int: 4 bytes. long: 8 bytes (64-bit Linux). long long: 8 bytes.",
          "float: 4 bytes. double: 8 bytes. long double: 16 bytes (x87 extended).",
          "Pointer: 8 bytes on 64-bit. sizeof(void*) == sizeof(size_t) == 8.",
          "Use <stdint.h>: int32_t, uint64_t etc. for guaranteed sizes.",
        ],
      },
      {
        heading: "Arrays & Pointer Arithmetic",
        color: "violet",
        icon: "🗃️",
        items: [
          "Array in memory: contiguous bytes. int a[5] allocates 20 bytes.",
          "a[i] ≡ *(a + i). Pointer +1 advances by sizeof(*ptr), not by 1 byte.",
          "int *p = a; p+3 points to a[3], i.e. 12 bytes past a.",
          "Address of a[i] = base + i × sizeof(element).",
          "2D array int a[R][C]: row-major. a[r][c] at offset (r×C + c) × sizeof(int).",
        ],
      },
      {
        heading: "C Strings",
        color: "emerald",
        icon: "📝",
        items: [
          "String = null-terminated char array: 'H','i','\\0' stored in 3 bytes.",
          "strlen() counts bytes until '\\0' — does not include it.",
          "strcpy/strcat: dangerous — no bounds checking. Use strncpy/strncat.",
          "String literals stored in read-only data segment; modifying them is UB.",
          "char s[] = \"hello\" — copies to stack (modifiable). char *s = \"hello\" — pointer to rodata.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "Off-by-one: null terminator requires one extra byte. \"hello\" needs 6 bytes.",
          "long is 4 bytes on Windows 64-bit (LLP64) but 8 bytes on Linux 64-bit (LP64).",
          "Array name decays to pointer to first element — except in sizeof() and &.",
          "sizeof(array) ÷ sizeof(element) = number of elements — works only in scope of declaration.",
        ],
      },
    ],
  },
  {
    number: 11,
    short: "Memory Layout",
    title: "Topic 11 – Memory Layout for Running Application",
    overview:
      "Every process has a virtual address space divided into well-defined segments. Knowing where code, globals, heap, and stack live helps debug crashes and understand security vulnerabilities like buffer overflows.",
    sections: [
      {
        heading: "Memory Segments",
        color: "indigo",
        icon: "🗂️",
        items: [
          "Text (code) segment: executable instructions, read-only. Starts at low address.",
          "Data segment: initialized global and static variables (e.g. int g = 5;).",
          "BSS segment: uninitialized globals and statics — zeroed by OS/startup code.",
          "Heap: dynamic memory (malloc/free). Grows upward from BSS.",
          "Stack: local variables, return addresses. Grows downward from high address.",
          "mmap region: between heap and stack — used for shared libs, file mappings.",
        ],
      },
      {
        heading: "Heap vs Stack",
        color: "violet",
        icon: "🆚",
        items: [
          "Stack allocation: implicit, instant (just adjust RSP). Freed on function return.",
          "Heap allocation: explicit (malloc → brk/mmap syscall). Must be freed manually.",
          "Stack overflow: RSP grows into guard page → SIGSEGV.",
          "Heap fragmentation: many allocate/free cycles leave holes of unusable memory.",
          "Stack default size ~8 MB on Linux. Heap can grow to available RAM + swap.",
        ],
      },
      {
        heading: "Linking & Layout",
        color: "amber",
        icon: "🔗",
        items: [
          "ELF sections .text, .data, .bss, .rodata map to runtime segments.",
          "Read-only data (.rodata): string literals, const globals — protected against writes.",
          "ASLR (Address Space Layout Randomization): randomizes base addresses at load time.",
          "Position-Independent Code (PIC): uses RIP-relative addressing so code runs at any address.",
          "Stack canary: sentinel value between local variables and return address — detects overflow.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "BSS variables are zeroed at startup — do not confuse with uninitialized (random) stack values.",
          "Global int g; → BSS. Global int g = 0; → also BSS (compiler optimizes zero-init to BSS).",
          "Stack grows DOWN; heap grows UP — they meet in the middle if both are very large.",
          "Writing past array end on stack overwrites return address — classic buffer overflow.",
        ],
      },
    ],
  },
  {
    number: 12,
    short: "Cache Memory",
    title: "Topic 12 – Memory Hierarchy: Cache",
    overview:
      "Cache exploits the principle of locality to hide the latency gap between fast CPUs and slow DRAM. Cache-friendly code can be 10–100× faster than cache-unfriendly code doing the same work.",
    sections: [
      {
        heading: "Locality Principles",
        color: "indigo",
        icon: "📍",
        items: [
          "Temporal locality: recently accessed data will be accessed again soon (loops, hot variables).",
          "Spatial locality: data near recently accessed data will be accessed soon (arrays, structs).",
          "Cache line: the unit of transfer between cache and DRAM. Typically 64 bytes on x86.",
          "Accessing one byte loads an entire 64-byte cache line — nearby data comes for free.",
          "Sequential array access = excellent spatial locality. Linked list traversal = poor.",
        ],
      },
      {
        heading: "Cache Structure",
        color: "violet",
        icon: "🏗️",
        items: [
          "Cache levels: L1 (~32 KB, ~4 cycles), L2 (~256 KB, ~12 cycles), L3 (~MB, ~40 cycles).",
          "DRAM: ~100–200 cycles. Disk: millions of cycles.",
          "Direct-mapped: each address maps to exactly one cache set. Fast, but high conflict miss rate.",
          "N-way set-associative: each set has N slots. Modern CPUs use 4–16 way.",
          "Fully associative: any line can go anywhere. Used for TLBs and small caches.",
        ],
      },
      {
        heading: "Write Policies & Eviction",
        color: "amber",
        icon: "✏️",
        items: [
          "Write-through: write to cache AND memory simultaneously. Simple but slow.",
          "Write-back: write only to cache; flush to memory when evicted. Faster, more complex.",
          "Dirty bit: marks a cache line as modified. Must write back before eviction.",
          "LRU (Least Recently Used): evict the line not accessed for the longest time.",
          "Cache miss types: cold (first access), capacity (cache too small), conflict (wrong set).",
        ],
      },
      {
        heading: "Performance Tips",
        color: "emerald",
        icon: "🚀",
        items: [
          "Row-major traversal of 2D arrays is cache-friendly (C/C++ store row by row).",
          "Column-major traversal jumps by row_size × sizeof(element) bytes — cache unfriendly.",
          "Structure layout: group frequently accessed fields together.",
          "False sharing: two threads writing to different fields in the same cache line thrash.",
          "Prefetching: CPU or software prefetch can hide latency for predictable access patterns.",
        ],
      },
    ],
  },
  {
    number: 13,
    short: "DRAM",
    title: "Topic 13 – Memory Hierarchy: DRAM",
    overview:
      "DRAM stores each bit as a charge in a capacitor, making it dense and cheap but slow and requiring periodic refresh. Understanding DRAM internals explains why memory access patterns matter.",
    sections: [
      {
        heading: "DRAM vs SRAM",
        color: "indigo",
        icon: "💾",
        items: [
          "DRAM: 1 transistor + 1 capacitor per bit. Dense, cheap, slow (~50–100 ns).",
          "SRAM: 6 transistors per bit (flip-flop). Fast (~1 ns), small capacity, expensive.",
          "Cache is SRAM. Main memory is DRAM. Registers are flip-flops (even faster).",
          "DRAM needs periodic refresh (capacitor leaks charge) every ~64 ms.",
          "Refresh pauses access — causes periodic latency spikes.",
        ],
      },
      {
        heading: "DRAM Organization",
        color: "violet",
        icon: "🔲",
        items: [
          "DRAM organized as 2D array of cells: rows × columns.",
          "Row address sent first (RAS — Row Address Strobe), then column address (CAS — Column Address Strobe).",
          "CAS latency (CL): cycles from column address to data. E.g. CL16 = 16 cycles.",
          "Burst mode: after activating a row, subsequent column accesses are fast (row remains open).",
          "Bank: independent DRAM subarray. Multiple banks allow overlapping accesses.",
        ],
      },
      {
        heading: "Modern DRAM",
        color: "amber",
        icon: "📡",
        items: [
          "DDR4/DDR5: Double Data Rate — transfers on both rising and falling clock edges.",
          "DIMM: Dual Inline Memory Module — the physical RAM stick.",
          "Memory controller: part of CPU (since ~2009) that manages DRAM timing.",
          "Bandwidth = bus width × clock rate × 2 (DDR). E.g. DDR4-3200: 25.6 GB/s.",
          "Latency is roughly constant (~50–100 ns) regardless of DDR generation.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "Higher DDR number = higher bandwidth but NOT necessarily lower latency.",
          "DRAM refresh occupies the bus — memory is briefly unavailable during refresh.",
          "Row buffer: last opened DRAM row stays cached. Accessing same row again is faster.",
          "DRAM is volatile — data lost on power off. Unlike Flash/SSD which is non-volatile.",
        ],
      },
    ],
  },
  {
    number: 14,
    short: "HDD & SSD",
    title: "Topic 14 – Memory Hierarchy: HDD and SSD",
    overview:
      "Persistent storage (HDD/SSD) is orders of magnitude slower than DRAM but retains data without power. HDDs use mechanical movement; SSDs use NAND flash. Understanding their characteristics drives good I/O performance choices.",
    sections: [
      {
        heading: "HDD Structure",
        color: "indigo",
        icon: "💿",
        items: [
          "Platters: spinning magnetic disks (5400–15000 RPM).",
          "Track: concentric circle on a platter. Sector: smallest addressable unit (512B or 4KB).",
          "Seek time: time to move read/write head to correct track (~3–10 ms average).",
          "Rotational latency: wait for sector to rotate under head (~0–8 ms, avg = half period).",
          "Transfer time: time to read/write the data once head is positioned.",
          "Total access time ≈ seek + rotational latency + transfer. Typically 5–15 ms.",
        ],
      },
      {
        heading: "SSD (NAND Flash)",
        color: "violet",
        icon: "⚡",
        items: [
          "No moving parts — purely electronic. Read latency ~0.1 ms. Write ~0.1–1 ms.",
          "NAND flash: written in pages (~4–16 KB), erased in blocks (~256 pages).",
          "Writes must erase before rewrite — write amplification can degrade performance.",
          "Wear leveling: controller spreads writes to prevent single cells from wearing out.",
          "SLC (1 bit/cell): fastest, most durable. MLC (2b), TLC (3b), QLC (4b): denser but slower/less durable.",
        ],
      },
      {
        heading: "Comparison Table",
        color: "amber",
        icon: "📊",
        items: [
          "Access latency: Registers < SRAM (L1) < SRAM (L2/L3) < DRAM < SSD < HDD",
          "Typical: L1=1ns, L2=5ns, L3=20ns, DRAM=60ns, SSD=100µs, HDD=10ms",
          "Bandwidth: DRAM ~50 GB/s, NVMe SSD ~7 GB/s, SATA SSD ~500 MB/s, HDD ~200 MB/s",
          "Cost per GB: HDD cheapest, DRAM most expensive (per GB), SSD in between.",
          "Volatility: registers/SRAM/DRAM lose data on power off. SSD/HDD retain it.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "HDD sequential reads are much faster than random reads (seeks dominate random I/O).",
          "SSD random read is nearly as fast as sequential (no seek penalty).",
          "SSD writes can be slow if many blocks need garbage collection first.",
          "TRIM command tells SSD which blocks are free so it can pre-erase them.",
        ],
      },
    ],
  },
  {
    number: 15,
    short: "Linkers & Libraries",
    title: "Topic 15 – Linkers, Symbols, Libraries",
    overview:
      "The compilation pipeline turns source code into an executable through four stages. The linker resolves cross-file references and decides how libraries are incorporated.",
    sections: [
      {
        heading: "Compilation Pipeline",
        color: "indigo",
        icon: "🔨",
        items: [
          "1. Preprocessing (cpp): expand macros, #include, #ifdef → .i file.",
          "2. Compilation (cc1): translate C to assembly → .s file.",
          "3. Assembly (as): translate assembly to machine code → .o (object file).",
          "4. Linking (ld): combine .o files, resolve symbols, produce executable.",
          "Object file (.o): contains code + data + relocation entries + symbol table.",
        ],
      },
      {
        heading: "Symbols & Resolution",
        color: "violet",
        icon: "🔗",
        items: [
          "Strong symbol: defined function or initialized global. Only one allowed per name.",
          "Weak symbol: uninitialized global or __attribute__((weak)). Can be overridden.",
          "Linker rules: two strong → error. One strong + weak → use strong. Two weak → pick one.",
          "Undefined symbol at link time → linker error unless resolved by library.",
          "nm tool: lists symbols in object/executable. T = text, U = undefined, D = data.",
        ],
      },
      {
        heading: "Static vs Dynamic Libraries",
        color: "amber",
        icon: "📦",
        items: [
          "Static library (.a): archive of .o files. Linker copies needed .o into executable.",
          "Dynamic/shared library (.so / .dll): loaded at runtime. Not copied into executable.",
          "Advantages of static: self-contained, no runtime deps, slightly faster calls.",
          "Advantages of dynamic: smaller executables, shared memory across processes, hot updates.",
          "PLT (Procedure Linkage Table) + GOT (Global Offset Table): mechanism for dynamic calls.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "Static lib order matters: linker scans left-to-right; define libs after object files that use them.",
          "Shared lib: ldd shows runtime dependencies. Missing .so → 'not found' error at run time.",
          "ASLR + PIC: shared libs compiled with -fPIC use RIP-relative addressing.",
          "Symbol interposition: LD_PRELOAD can inject a .so that overrides symbols (e.g. malloc wrappers).",
        ],
      },
    ],
  },
  {
    number: 16,
    short: "Exceptions & Interrupts",
    title: "Topic 16 – Asynchronous & Synchronous Exceptions",
    overview:
      "The CPU can transfer control to the OS in four situations: hardware interrupts, traps, faults, and aborts. The OS handles these via the Interrupt Descriptor Table (IDT) and exception handlers.",
    sections: [
      {
        heading: "Exception Classes",
        color: "indigo",
        icon: "⚡",
        items: [
          "Interrupt (async): from external hardware — timer, keyboard, NIC. Not caused by current instruction.",
          "Trap (sync, intentional): deliberate from user code — syscall (int 0x80 / SYSCALL), breakpoint (int3).",
          "Fault (sync, recoverable): caused by current instruction but can be retried — page fault, divide-by-zero, segment fault.",
          "Abort (sync, unrecoverable): hardware error or double fault. Process/system must terminate.",
          "After handling: interrupts and traps resume at NEXT instruction; faults retry SAME instruction.",
        ],
      },
      {
        heading: "Exception Mechanism",
        color: "violet",
        icon: "🔄",
        items: [
          "IDT (Interrupt Descriptor Table): array of 256 gate descriptors, one per exception/interrupt.",
          "IDTR register: points to IDT base address and limit.",
          "On exception: CPU saves context (RIP, CS, RFLAGS, RSP) on kernel stack, looks up IDT entry, jumps to handler.",
          "Exception handler runs in kernel mode (ring 0).",
          "IRET instruction: returns from exception handler, restoring saved context.",
        ],
      },
      {
        heading: "Kernel vs User Mode",
        color: "amber",
        icon: "🔒",
        items: [
          "Ring 0 (kernel mode): full hardware access, privileged instructions allowed.",
          "Ring 3 (user mode): restricted access — cannot directly access I/O, modify page tables.",
          "Syscall: controlled transition from user to kernel via SYSCALL/SYSRET or int 0x80.",
          "Linux syscall numbers in RAX. Arguments in RDI, RSI, RDX, R10, R8, R9.",
          "Context switch: OS saves register state of current process, loads state of next process.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "Page fault is a FAULT (retried) not an abort — page is loaded, then instruction retried.",
          "Division by zero = fault (#DE). Fires before the instruction completes.",
          "Trap vs interrupt: trap is synchronous (from current instruction); interrupt is asynchronous.",
          "Double fault: exception occurs while handling another exception → abort.",
        ],
      },
    ],
  },
  {
    number: 17,
    short: "Processes & Threads",
    title: "Topic 17 – Processes, Threads, Race Conditions",
    overview:
      "A process is an isolated instance of a running program. Threads share address space but have independent stacks. Race conditions arise when multiple threads access shared data without synchronization.",
    sections: [
      {
        heading: "Processes",
        color: "indigo",
        icon: "🖥️",
        items: [
          "Process: program in execution with own address space, file descriptors, PID.",
          "fork(): creates child = copy of parent. Returns PID of child to parent, 0 to child.",
          "exec(): replaces current process image with new program. PID stays the same.",
          "wait()/waitpid(): parent blocks until child terminates; collects exit status.",
          "Zombie: terminated child whose parent hasn't called wait yet. Orphan: child whose parent died.",
        ],
      },
      {
        heading: "Threads",
        color: "violet",
        icon: "🧵",
        items: [
          "Thread: lightweight execution context within a process. Shares code, heap, globals.",
          "Each thread has its own: stack, registers, program counter, thread-local storage.",
          "pthreads API: pthread_create, pthread_join, pthread_mutex_lock/unlock.",
          "Green threads vs kernel threads: kernel threads scheduled by OS (true parallelism on multi-core).",
          "Thread creation is cheaper than fork — no address space duplication.",
        ],
      },
      {
        heading: "Race Conditions",
        color: "red",
        icon: "🏁",
        items: [
          "Race condition: outcome depends on non-deterministic interleaving of thread operations.",
          "Example: counter++ compiled as READ–INCREMENT–WRITE. Two threads can interleave.",
          "Critical section: code that accesses shared data — must not run concurrently.",
          "Data race: two threads access same memory, at least one writes, no synchronization.",
          "TOCTOU (Time-Of-Check Time-Of-Use): check + use are not atomic — another thread can change state between them.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "amber",
        icon: "⚠️",
        items: [
          "fork() duplicates file descriptors — both parent and child can read/write same files.",
          "After exec(), the old code/data/stack is replaced — no return to caller.",
          "Threads share heap but have separate stacks — local variables are thread-safe.",
          "volatile does not provide synchronization — use mutexes or atomics.",
        ],
      },
    ],
  },
  {
    number: 18,
    short: "Signals & setjmp",
    title: "Topic 18 – Signals, Signal Handlers, Nonlocal Jumps",
    overview:
      "Signals are software interrupts sent to processes. setjmp/longjmp provide a way to jump across function call boundaries — useful for error recovery but dangerous if misused.",
    sections: [
      {
        heading: "Signals",
        color: "indigo",
        icon: "📡",
        items: [
          "Common signals: SIGINT (Ctrl+C), SIGTERM (graceful stop), SIGKILL (cannot be caught), SIGSEGV (segfault), SIGCHLD (child stopped/exited), SIGALRM (timer).",
          "Default actions: terminate, terminate+core dump, stop, continue, or ignore.",
          "signal(SIGINT, handler) or sigaction() — install a signal handler.",
          "Pending signal: delivered when process is next scheduled and signal is not blocked.",
          "Signal mask: set of blocked signals (sigprocmask). Blocked signals remain pending.",
        ],
      },
      {
        heading: "Signal Handlers",
        color: "violet",
        icon: "🔔",
        items: [
          "Handler runs asynchronously — can interrupt any instruction.",
          "Only async-signal-safe functions can be called from handlers (e.g. write(), _exit()).",
          "Unsafe in handlers: printf, malloc, any function using locks.",
          "Common pattern: set a volatile sig_atomic_t flag in handler, check it in main loop.",
          "Reentrancy: handler can re-enter a function currently executing — dangerous with global state.",
        ],
      },
      {
        heading: "setjmp / longjmp",
        color: "amber",
        icon: "🦘",
        items: [
          "setjmp(env): saves register state + stack pointer into env. Returns 0.",
          "longjmp(env, val): restores saved state, jumps back to setjmp call. setjmp returns val.",
          "Used for exception-like error handling in C (before C++ exceptions).",
          "Dangerous: skips destructors, cleanup code between setjmp and longjmp call site.",
          "Local variables in function with setjmp should be volatile to avoid being optimized away.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "SIGKILL and SIGSTOP cannot be caught or ignored — always use default action.",
          "printf in signal handler is undefined behavior (not async-signal-safe).",
          "longjmp after the function containing setjmp has returned = UB (stack frame gone).",
          "Signals are not queued (except real-time signals) — multiple signals of same type may merge.",
        ],
      },
    ],
  },
  {
    number: 19,
    short: "I/O & stdio",
    title: "Topic 19 – Input/Output, Standard I/O",
    overview:
      "Unix I/O uses file descriptors as a uniform interface for files, pipes, sockets, and devices. The stdio library adds buffering on top for efficiency. Understanding buffering explains many surprising output behaviors.",
    sections: [
      {
        heading: "Unix File Descriptors",
        color: "indigo",
        icon: "📁",
        items: [
          "File descriptor (fd): small non-negative integer. 0=stdin, 1=stdout, 2=stderr.",
          "open(path, flags, mode) → fd. read(fd, buf, n). write(fd, buf, n). close(fd).",
          "Everything is a file: regular files, devices, pipes, sockets — same API.",
          "Inheritance: child process inherits parent's open file descriptors after fork.",
          "lseek(fd, offset, whence): reposition file offset. Only for regular files.",
        ],
      },
      {
        heading: "Buffering in stdio",
        color: "violet",
        icon: "🛢️",
        items: [
          "Fully buffered: fflush when buffer full or fflush()/fclose() called. Used for regular files.",
          "Line buffered: flush on newline or buffer full. Default for stdout when connected to terminal.",
          "Unbuffered: every write goes to kernel immediately. Default for stderr.",
          "setvbuf(stream, buf, mode, size): change buffering mode. _IOFBF, _IOLBF, _IONBF.",
          "fflush(stdout): forces buffered output — needed before fork or before calling exec.",
        ],
      },
      {
        heading: "Redirection & Pipes",
        color: "amber",
        icon: "🔀",
        items: [
          "dup2(oldfd, newfd): redirect newfd to point to same file as oldfd.",
          "Shell redirection: ls > out.txt internally does open(\"out.txt\", ...) then dup2(fd, 1).",
          "pipe(fds): creates pipe. fds[0] = read end, fds[1] = write end.",
          "Pipe + fork: classic way to connect two processes (producer → consumer).",
          "EOF: read() returns 0 when writer closes write end of pipe.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "printf without \\n may not appear immediately if output is fully buffered.",
          "After fork, both parent and child have buffered data — can cause duplicated output. Call fflush before fork.",
          "close() does not guarantee data is flushed — use fsync() for durability.",
          "POSIX read/write can return fewer bytes than requested — always loop until all bytes transferred.",
        ],
      },
    ],
  },
  {
    number: 20,
    short: "Virtual Memory",
    title: "Topic 20 – Virtual Memory & Address Translation",
    overview:
      "Virtual memory gives each process the illusion of a large private address space. The hardware (MMU) translates virtual addresses to physical addresses using page tables, with the TLB as a cache for recent translations.",
    sections: [
      {
        heading: "Virtual Address Translation",
        color: "indigo",
        icon: "🗺️",
        items: [
          "VA (virtual address) → PA (physical address) via page table walk.",
          "Page: fixed-size block of memory, typically 4 KB (12-bit offset).",
          "Virtual address split: page number | page offset. Page table maps page numbers to frames.",
          "x86-64 uses 4-level page tables: PML4 → PDPT → PD → PT → physical page.",
          "CR3 register: holds physical address of current PML4 (top-level page table).",
        ],
      },
      {
        heading: "TLB",
        color: "violet",
        icon: "⚡",
        items: [
          "TLB (Translation Lookaside Buffer): small, fast cache of recent VA→PA translations.",
          "TLB hit: translation found (~1 cycle). TLB miss: full 4-level page table walk (~40+ cycles).",
          "TLB is flushed on context switch (or with PCID extension, selectively).",
          "INVLPG instruction: invalidates single TLB entry. MOV CR3: flushes entire TLB.",
          "Huge pages (2MB, 1GB): fewer TLB entries needed for same memory — reduces TLB misses.",
        ],
      },
      {
        heading: "Page Faults & Demand Paging",
        color: "amber",
        icon: "⚠️",
        items: [
          "Page fault (#PF): page not in physical memory or access rights violated.",
          "Minor fault: page in swap/mapped file — OS loads it, instruction retried.",
          "Major fault: page on disk — expensive I/O needed.",
          "Demand paging: pages allocated only when first accessed (fork uses copy-on-write).",
          "Copy-on-Write (CoW): parent and child share read-only pages; copy made only on write.",
          "Page table entry bits: present, read/write, user/supervisor, accessed, dirty.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "Segmentation fault = page fault with protection violation (write to read-only, null deref).",
          "Virtual addresses in 64-bit are 48 bits used (canonical form) — not full 64 bits.",
          "TLB flush on every context switch is expensive — OS tries to minimize context switches.",
          "swap space ≠ virtual memory. Swap is backing store for evicted pages.",
        ],
      },
    ],
  },
  {
    number: 21,
    short: "Concurrent Programming",
    title: "Topic 21 – Concurrent Programming",
    overview:
      "Concurrent programming requires explicit synchronization to avoid data races. Mutexes, semaphores, and condition variables are the primary tools. Deadlock is the most dangerous failure mode.",
    sections: [
      {
        heading: "Mutexes",
        color: "indigo",
        icon: "🔐",
        items: [
          "Mutex: mutual exclusion lock. Only one thread can hold it at a time.",
          "pthread_mutex_lock: blocks until lock acquired. pthread_mutex_unlock: releases.",
          "Must unlock same mutex you locked — and from same thread.",
          "Recursive mutex: same thread can lock multiple times (must unlock same number).",
          "Spinlock: busy-waits instead of sleeping. Fast for short critical sections, wastes CPU for long ones.",
        ],
      },
      {
        heading: "Semaphores",
        color: "violet",
        icon: "🚦",
        items: [
          "Semaphore: integer counter ≥ 0. sem_wait() decrements (blocks if 0). sem_post() increments.",
          "Binary semaphore (0 or 1): equivalent to mutex.",
          "Counting semaphore: controls access to N resources (e.g. connection pool).",
          "sem_init(sem, 0, count): 2nd arg=0 means thread-shared (not process-shared).",
          "Producer-consumer: producer posts, consumer waits — natural synchronization.",
        ],
      },
      {
        heading: "Deadlock",
        color: "red",
        icon: "💀",
        items: [
          "Deadlock: circular wait where each thread holds a resource needed by the next.",
          "Coffman conditions (all must hold): mutual exclusion, hold-and-wait, no preemption, circular wait.",
          "Prevention: break one condition — e.g. always acquire locks in fixed global order.",
          "Detection: resource-allocation graph. Banker's algorithm for avoidance.",
          "Livelock: threads keep changing state but make no progress (e.g. two people stepping aside for each other).",
        ],
      },
      {
        heading: "Condition Variables",
        color: "emerald",
        icon: "📢",
        items: [
          "Condition variable: lets threads wait for a condition to become true.",
          "pthread_cond_wait(cond, mutex): atomically releases mutex and sleeps.",
          "pthread_cond_signal: wakes one waiting thread. pthread_cond_broadcast: wakes all.",
          "Always re-check condition in a loop (spurious wakeups): while (!ready) pthread_cond_wait(…).",
          "Monitor pattern: mutex + condition variable protect shared state.",
        ],
      },
    ],
  },
  {
    number: 22,
    short: "Parallelism & Synchronization",
    title: "Topic 22 – Parallelism & Synchronization",
    overview:
      "Parallelism uses multiple cores to do work simultaneously. Amdahl's law limits achievable speedup based on the serial fraction of work. Memory consistency models and atomic operations underpin correct parallel code.",
    sections: [
      {
        heading: "Parallelism Types",
        color: "indigo",
        icon: "⚙️",
        items: [
          "Data parallelism: same operation on different data chunks. E.g. SIMD, parallel for loop.",
          "Task parallelism: different tasks run concurrently on different cores.",
          "OpenMP: #pragma omp parallel for — compiler parallelizes loop across threads.",
          "Thread pool: pre-created threads pick up tasks from queue — avoids creation overhead.",
          "SIMD: Single Instruction Multiple Data. SSE/AVX process 4–16 floats per instruction.",
        ],
      },
      {
        heading: "Amdahl's Law",
        color: "violet",
        icon: "📈",
        items: [
          "Speedup = 1 / (S + (1–S)/P). S = serial fraction, P = number of processors.",
          "Example: 10% serial code, 8 cores → speedup ≤ 1 / (0.1 + 0.9/8) ≈ 4.7×",
          "Serial portion dominates at high P — diminishing returns from adding more cores.",
          "Gustafson's law: if problem size scales with P, speedup ≈ P – S×(P–1) — more optimistic.",
          "Always profile to find the bottleneck before parallelizing.",
        ],
      },
      {
        heading: "Memory Models & Atomics",
        color: "amber",
        icon: "🔄",
        items: [
          "Sequential consistency: all threads see operations in the same global order — expensive.",
          "Relaxed consistency: hardware/compiler may reorder operations — need memory barriers.",
          "Memory fence / barrier: prevents reordering across the fence.",
          "Atomic operations: read-modify-write in one uninterruptible step (compare-and-swap, fetch-and-add).",
          "C11/C++11 atomics: _Atomic / std::atomic — portable atomic operations with specified memory order.",
        ],
      },
      {
        heading: "False Sharing & Performance",
        color: "red",
        icon: "⚠️",
        items: [
          "False sharing: two threads write to different variables on the same 64-byte cache line → cache thrash.",
          "Fix: pad variables to cache line size (alignas(64)) so each is on its own line.",
          "Lock-free data structures: use atomics instead of mutexes — higher complexity, can improve throughput.",
          "Thundering herd: many threads wake on same event, all contend for same lock. Use broadcast carefully.",
        ],
      },
    ],
  },
  {
    number: 23,
    short: "Virtual Machines",
    title: "Topic 23 – Virtual Machines",
    overview:
      "A virtual machine (VM) runs an entire OS as a process on a host system. Containers provide lighter-weight isolation. Both are fundamental to modern cloud infrastructure.",
    sections: [
      {
        heading: "Hypervisors",
        color: "indigo",
        icon: "🖥️",
        items: [
          "Type 1 (bare-metal) hypervisor: runs directly on hardware. E.g. VMware ESXi, Xen, KVM.",
          "Type 2 (hosted) hypervisor: runs on top of host OS. E.g. VirtualBox, VMware Workstation.",
          "Type 1 is faster (no host OS overhead). Type 2 easier to install/use.",
          "Hypervisor controls physical CPU, memory, and I/O, multiplexing among guest VMs.",
          "VM: has virtualized CPU, RAM, storage, and network — unaware it is not on bare metal.",
        ],
      },
      {
        heading: "Virtualization Techniques",
        color: "violet",
        icon: "🔧",
        items: [
          "Full virtualization: guest OS runs unmodified. Hypervisor traps privileged instructions.",
          "Paravirtualization: guest OS modified to call hypervisor (hypercalls) instead of privileged instructions.",
          "Hardware-assisted virtualization: Intel VT-x / AMD-V. CPU has VMX root/non-root modes. Much faster trapping.",
          "Memory virtualization: shadow page tables or extended page tables (EPT/NPT) map guest physical → host physical.",
          "IOMMU (Intel VT-d): allows direct device assignment to guest VMs (PCIe passthrough).",
        ],
      },
      {
        heading: "Containers vs VMs",
        color: "amber",
        icon: "📦",
        items: [
          "Container: shares host kernel, isolated via Linux namespaces and cgroups.",
          "VM: full OS stack, own kernel, stronger isolation.",
          "Container overhead: near-zero. VM overhead: ~10% CPU, significant RAM (full OS).",
          "Container startup: milliseconds. VM startup: seconds to minutes.",
          "Docker uses namespaces (process, network, filesystem), cgroups (resource limits), and union FS layers.",
        ],
      },
      {
        heading: "Common Exam Traps",
        color: "red",
        icon: "⚠️",
        items: [
          "Containers are NOT VMs — they share the host kernel. No kernel isolation.",
          "VM escape: exploit that breaks out of VM into hypervisor — critical security vulnerability.",
          "Memory overcommit: hypervisor may allocate more RAM than physical — relies on VMs not all using max simultaneously.",
          "KVM is a Linux kernel module — it makes Linux itself a Type 1 hypervisor when combined with QEMU.",
        ],
      },
    ],
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  indigo: { bg: "bg-indigo-950/30", border: "border-indigo-500/25", text: "text-indigo-300", badge: "bg-indigo-500/15 text-indigo-300" },
  violet: { bg: "bg-violet-950/30", border: "border-violet-500/25", text: "text-violet-300", badge: "bg-violet-500/15 text-violet-300" },
  amber:  { bg: "bg-amber-950/30",  border: "border-amber-500/25",  text: "text-amber-300",  badge: "bg-amber-500/15 text-amber-300"  },
  red:    { bg: "bg-red-950/30",    border: "border-red-500/25",    text: "text-red-300",    badge: "bg-red-500/15 text-red-300"    },
  emerald:{ bg: "bg-emerald-950/30",border: "border-emerald-500/25",text: "text-emerald-300",badge: "bg-emerald-500/15 text-emerald-300"},
  orange: { bg: "bg-orange-950/30", border: "border-orange-500/25", text: "text-orange-300", badge: "bg-orange-500/15 text-orange-300"},
};

export default function StudyPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const topic = TOPICS[selected];

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function selectTopic(i: number) {
    setSelected(i);
    setOpenSections({});
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate("/")} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="font-semibold text-sm text-slate-200 truncate">CS231 Study Guide</span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-slate-500 text-xs hidden sm:inline">23 Topics</span>
        </div>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="sm:hidden flex items-center gap-1.5 text-xs text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 rounded-lg"
        >
          Topics <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? "block" : "hidden"} sm:block
          w-full sm:w-64 sm:flex-shrink-0 border-b sm:border-b-0 sm:border-r border-slate-800
          bg-slate-950 sm:bg-slate-900/40 overflow-y-auto
          absolute sm:relative z-10 top-auto sm:top-auto
          max-h-72 sm:max-h-none
        `}>
          <div className="p-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 mb-2">Topics</div>
            <div className="space-y-0.5">
              {TOPICS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => selectTopic(i)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                    selected === i
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <span className={`flex-shrink-0 w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${selected === i ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500"}`}>
                    {t.number}
                  </span>
                  <span className="truncate">{t.short}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Topic header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2.5 py-1 rounded-full">
                  Topic {topic.number}
                </span>
                {/* Desktop prev/next */}
                <div className="ml-auto flex items-center gap-2">
                  {selected > 0 && (
                    <button onClick={() => selectTopic(selected - 1)} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                      ← Prev
                    </button>
                  )}
                  {selected < TOPICS.length - 1 && (
                    <button onClick={() => selectTopic(selected + 1)} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                      Next →
                    </button>
                  )}
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-3">{topic.title}</h1>
              <p className="text-slate-400 text-sm leading-relaxed">{topic.overview}</p>
            </div>

            {/* Sections */}
            <div className="space-y-3">
              {topic.sections.map((sec, si) => {
                const key = `${selected}-${si}`;
                const isOpen = openSections[key] !== false; // open by default
                const colors = COLOR_MAP[sec.color] ?? COLOR_MAP.indigo;
                return (
                  <div key={si} className={`border rounded-xl overflow-hidden ${colors.border} ${colors.bg}`}>
                    <button
                      onClick={() => toggleSection(key)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{sec.icon}</span>
                        <span className={`font-semibold text-sm ${colors.text}`}>{sec.heading}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 ${colors.text} flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <ul className="px-4 pb-4 space-y-2">
                        {sec.items.map((item, ii) => (
                          <li key={ii} className="flex items-start gap-2.5">
                            <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${colors.text.replace("text-", "bg-")}`} />
                            <span className="text-slate-300 text-sm leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick links */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/exam")}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
              >
                <Star className="w-4 h-4" /> Practice this in Exam
              </button>
              {selected < TOPICS.length - 1 && (
                <button
                  onClick={() => selectTopic(selected + 1)}
                  className="flex-1 flex items-center justify-center gap-2 border border-slate-700 text-slate-300 hover:bg-slate-800 py-2.5 rounded-xl transition-all text-sm"
                >
                  Next Topic <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
