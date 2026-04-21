import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronRight, ChevronDown, Star } from "lucide-react";

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
    number: 1, short: "Binary & Byte Ordering",
    title: "Topic 1 – Binary Representation & Byte Ordering",
    overview: "Computers store all data as binary (base-2). A byte is 8 bits and the smallest addressable memory unit. Understanding number bases and multi-byte layout in memory is fundamental to low-level programming.",
    sections: [
      { heading: "Number Systems", color: "indigo", icon: "🔢", items: [
        "Binary (base-2): digits 0–1. E.g. 11101101₂ = 237₁₀",
        "Hex (base-16): digits 0–9, A–F. 1 hex digit = 4 bits (nibble). 0xED = 237₁₀",
        "1 byte = 8 bits = 2 hex digits. A 32-bit int = 8 hex digits.",
        "Conversion: divide by target base repeatedly, collect remainders bottom-up.",
      ]},
      { heading: "Byte-Oriented Memory", color: "violet", icon: "🧠", items: [
        "Each address holds exactly 1 byte. CPU forms addresses of individual bytes.",
        "Word size = natural data unit. x86-64 has 64-bit (8-byte) word.",
        "64-bit word → theoretical max 2^64 bytes addressable.",
        "32-bit CPU → max 2^32 = 4 GB RAM directly addressable.",
      ]},
      { heading: "Endianness", color: "amber", icon: "🔄", items: [
        "Big-endian: most significant byte at lowest address. 0x12345678 at 0x100 → [0x12, 0x34, 0x56, 0x78]",
        "Little-endian: least significant byte at lowest address. x86 is little-endian. → [0x78, 0x56, 0x34, 0x12]",
        "Network byte order = big-endian. Use htonl()/ntohl() for integers over network.",
        "Detect in C: union { int i; char c[4]; } u = {1}; if (u.c[0] == 1) → little-endian.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Little-endian: address 0x100 holds the LEAST significant byte.",
        "Writing to EAX zero-extends into RAX. Writing to AX does NOT affect upper 32 bits.",
        "A nibble = 4 bits = 1 hex digit. A QWORD = 8 bytes = 64 bits.",
        "Bit 7 of 8-bit value = MSB (leftmost in standard notation).",
      ]},
    ],
  },
  {
    number: 2, short: "Integers & Arithmetic",
    title: "Topic 2 – Encoding Integers & Arithmetic",
    overview: "Modern CPUs use two's complement for signed integers, allowing the same adder hardware for both signed and unsigned. Understanding overflow, sign extension, and shifts is critical for low-level code.",
    sections: [
      { heading: "Two's Complement", color: "indigo", icon: "➕", items: [
        "To negate: flip all bits (one's complement), then add 1.",
        "8-bit signed range: –128 to +127. Formula: –2^(n-1) to 2^(n-1)–1.",
        "One more negative than positive because 0 is positive.",
        "Two's complement of 0 is 0: flip 0x00 → 0xFF, add 1 → overflow to 0x00.",
        "Benefit: addition/subtraction hardware identical for signed and unsigned.",
      ]},
      { heading: "Overflow & Flags", color: "orange", icon: "🚨", items: [
        "Unsigned overflow: wraps modulo 2^n. Detected by Carry Flag (CF).",
        "Signed overflow: exceeds representable range. Detected by Overflow Flag (OF).",
        "Unsigned 8-bit: 255 + 1 = 0 (CF=1). Signed 8-bit: 127 + 1 = –128 (OF=1).",
        "Casting negative signed int to unsigned: value becomes 2^n + original. (uint8_t)(-1) = 255.",
        "ZF = result is zero. SF = result is negative (MSB=1).",
      ]},
      { heading: "Sign & Zero Extension", color: "violet", icon: "↔️", items: [
        "Sign extension: replicate MSB to fill wider register. Used for signed values.",
        "8-bit 0b10110011 (–77) sign-extended to 16-bit: 0b1111111110110011.",
        "Zero extension: fill upper bits with 0. Used for unsigned values.",
        "x86-64: writing to EAX (32-bit) auto zero-extends into RAX.",
        "MOVSX = move with sign extension. MOVZX = move with zero extension.",
      ]},
      { heading: "Shifts & Multiply", color: "emerald", icon: "✖️", items: [
        "MUL/IMUL: implicit operand RAX; result in RDX:RAX (128-bit).",
        "DIV/IDIV: divide RDX:RAX by operand; quotient in RAX, remainder in RDX.",
        "Division by zero → #DE exception (Divide Error).",
        "SHL/SHR: logical shift (fill 0). Multiply/divide by powers of 2.",
        "SAR: arithmetic shift right — preserves sign bit. –8 SAR 1 = –4.",
        "In C: >> on signed types is usually arithmetic (implementation-defined).",
      ]},
    ],
  },
  {
    number: 3, short: "Floating Point",
    title: "Topic 3 – Encoding Fractional Numbers (Float/Double)",
    overview: "IEEE 754 is the standard for floating-point. Its structure explains why 0.1 + 0.2 ≠ 0.3 in computers and how special values like NaN and infinity work.",
    sections: [
      { heading: "IEEE 754 Format", color: "indigo", icon: "🔬", items: [
        "float (32-bit): 1 sign + 8 exponent + 23 mantissa bits.",
        "double (64-bit): 1 sign + 11 exponent + 52 mantissa bits.",
        "Value = (–1)^sign × 1.mantissa × 2^(exponent – bias).",
        "Bias: 127 for float, 1023 for double. Stored exponent = actual + bias.",
        "Implicit leading 1 in mantissa for normalized numbers.",
      ]},
      { heading: "Special Values", color: "violet", icon: "⭐", items: [
        "+/– Zero: exponent & mantissa all 0. Two zeros: +0 and –0, compare equal.",
        "Denormalized: exponent field = 0. No implicit leading 1. Gradual underflow.",
        "Infinity: exponent all 1s, mantissa = 0. From overflow or 1.0/0.0.",
        "NaN: exponent all 1s, mantissa ≠ 0. From 0/0, sqrt(–1), etc.",
        "NaN ≠ NaN is always true — use isnan() to check.",
      ]},
      { heading: "Precision & Rounding", color: "amber", icon: "📏", items: [
        "float: ~7 decimal digits. double: ~15–16 digits.",
        "0.1 cannot be represented exactly in binary.",
        "Default rounding: round-to-nearest-even.",
        "Associativity fails: (a+b)+c ≠ a+(b+c) due to rounding.",
        "Never compare floats with ==; use |a – b| < epsilon.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Exponent 0 = denormalized (no implicit 1). Exponent all-1s = Inf/NaN.",
        "Casting float→int truncates (round-toward-zero), not rounds.",
        "int can exactly represent integers float cannot (large primes > 2^24).",
      ]},
    ],
  },
  {
    number: 4, short: "x86 Registers & CPU",
    title: "Topic 4 – x86/x64 Processors & Registers",
    overview: "x86-64 CPUs have 16 general-purpose 64-bit registers, a flags register, and an instruction pointer. Register naming and condition flags are essential for reading and writing assembly.",
    sections: [
      { heading: "General-Purpose Registers", color: "indigo", icon: "🗂️", items: [
        "64-bit: RAX, RBX, RCX, RDX, RSI, RDI, RBP, RSP, R8–R15.",
        "32-bit sub-register: EAX, EBX, ECX, EDX, ESI, EDI, EBP, ESP, R8D–R15D.",
        "16-bit: AX, BX, CX, DX, SI, DI, BP, SP. 8-bit low: AL, BL, CL, DL...",
        "AH, BH, CH, DH = high byte of 16-bit AX/BX/CX/DX (legacy).",
        "Writing EAX zero-extends to RAX. Writing AX/AL does NOT zero upper bits.",
      ]},
      { heading: "Special Registers", color: "violet", icon: "🎯", items: [
        "RSP: stack pointer — points to top of stack (lowest used address).",
        "RBP: base/frame pointer — used to establish stack frame.",
        "RIP: instruction pointer — address of next instruction.",
        "RFLAGS: condition flags. Bits: CF, ZF, SF, OF, PF, DF.",
        "Segment registers (CS, DS, SS, FS, GS) — mostly legacy; FS/GS for TLS.",
      ]},
      { heading: "Condition Flags", color: "amber", icon: "🚩", items: [
        "CF (Carry): unsigned overflow or borrow.",
        "ZF (Zero): result was zero.",
        "SF (Sign): result was negative (MSB = 1).",
        "OF (Overflow): signed overflow.",
        "PF (Parity): result has even number of 1-bits.",
        "DF (Direction): controls string instruction direction.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "RCX = loop counter (LOOP decrements RCX).",
        "RDI = 1st arg, RSI = 2nd arg (System V AMD64 ABI).",
        "RFLAGS not directly named — use pushfq/popfq to access.",
      ]},
    ],
  },
  {
    number: 5, short: "Assembly & Arithmetic",
    title: "Topic 5 – Assembly Language & Arithmetic",
    overview: "NASM uses Intel syntax: destination first, source second. Assembly maps nearly 1:1 to machine code. Mastering arithmetic and bitwise instructions is the core of low-level programming.",
    sections: [
      { heading: "Basic Instructions", color: "indigo", icon: "⚙️", items: [
        "MOV dst, src — copy src into dst. Does NOT set flags.",
        "ADD/SUB dst, src — sets CF, ZF, SF, OF.",
        "INC/DEC dst — does NOT modify CF.",
        "NEG dst — two's complement negation = NOT + 1.",
        "CMP a, b — computes a–b, sets flags, discards result. Use before jumps.",
        "TEST dst, src — computes AND, sets flags, discards result. TEST rax, rax; jz = jump if zero.",
      ]},
      { heading: "Multiply & Divide", color: "violet", icon: "✖️", items: [
        "MUL src — unsigned: RAX × src → RDX:RAX.",
        "IMUL src — signed. Also 2-op: IMUL dst, src. 3-op: IMUL dst, src, imm.",
        "DIV src — unsigned: RDX:RAX ÷ src → quotient RAX, remainder RDX.",
        "IDIV — signed. Must sign-extend RAX into RDX with CQO before IDIV.",
        "Multiply by 10: LEA rax, [rax + rax*4]; SHL rax, 1",
      ]},
      { heading: "Bitwise & Shift", color: "emerald", icon: "🔧", items: [
        "AND dst, src — mask bits. AND al, 0x0F keeps low nibble.",
        "OR dst, src — set bits.",
        "XOR dst, src — toggle. XOR reg, reg = zero register (faster than MOV reg, 0).",
        "NOT dst — one's complement.",
        "SHL/SHR by n — logical shift (fills 0). SAR — arithmetic (preserves sign).",
        "ROL/ROR — rotate (bits wrap around).",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "NASM: destination FIRST (Intel), unlike AT&T where source is first.",
        "INC/DEC don't set CF — important for multi-precision arithmetic.",
        "XOR reg, reg encodes smaller and runs faster than MOV reg, 0.",
      ]},
    ],
  },
  {
    number: 6, short: "Memory Addressing & Jumps",
    title: "Topic 6 – Memory Addressing, MOV, LEA, Jumps, Loops",
    overview: "x86 has powerful addressing modes. LEA computes addresses without touching memory. Conditional jumps form all control flow.",
    sections: [
      { heading: "Addressing Modes", color: "indigo", icon: "📍", items: [
        "[reg] — memory at reg. MOV rax, [rbx]",
        "[reg + disp] — register + offset. MOV rax, [rbp – 8]",
        "[base + index*scale + disp] — full mode. Scale ∈ {1, 2, 4, 8}.",
        "MOV eax, [rcx + rdx*4 + 8] — access int array element.",
        "Size specifiers: BYTE PTR, WORD PTR, DWORD PTR, QWORD PTR.",
      ]},
      { heading: "LEA vs MOV", color: "violet", icon: "🔗", items: [
        "LEA dst, [expr] — computes address, stores it. NO memory access.",
        "MOV dst, [expr] — reads from memory at that address.",
        "LEA rax, [rbx + rcx*4] → rax = rbx + rcx×4 (pure arithmetic).",
        "LEA for efficient multiply: LEA rax, [rax + rax*2] = rax × 3.",
        "LEA does NOT affect flags.",
      ]},
      { heading: "Conditional Jumps", color: "amber", icon: "↪️", items: [
        "JE/JZ — jump if equal/zero (ZF=1).",
        "JNE/JNZ — not equal/not zero (ZF=0).",
        "JL/JNGE — signed less than (SF≠OF).",
        "JG/JNLE — signed greater than (ZF=0 and SF=OF).",
        "JB/JC — unsigned below (CF=1). JA — above (CF=0 and ZF=0).",
        "Always CMP or TEST before conditional jump.",
      ]},
      { heading: "Loops", color: "emerald", icon: "🔁", items: [
        "LOOP label — decrements RCX, jumps if RCX ≠ 0.",
        "LOOPE/LOOPNE — also check ZF.",
        "Prefer DEC + JNZ over LOOP (faster on modern CPUs).",
        "REP MOVSB/MOVSQ — copy RCX bytes/qwords (fast memory copy).",
      ]},
    ],
  },
  {
    number: 7, short: "Stack & Procedures",
    title: "Topic 7 – Stack, Procedures, Stack Frame",
    overview: "The call stack stores local variables, saved registers, and return addresses. The System V AMD64 ABI defines argument passing and register preservation contracts.",
    sections: [
      { heading: "Stack Mechanics", color: "indigo", icon: "📚", items: [
        "Stack grows downward. PUSH decrements RSP by 8, then writes.",
        "RSP points to top (lowest address) of stack.",
        "PUSH rax ≡ SUB rsp, 8 ; MOV [rsp], rax",
        "POP rax ≡ MOV rax, [rsp] ; ADD rsp, 8",
        "Stack must be 16-byte aligned at point of CALL (System V ABI).",
      ]},
      { heading: "CALL & RET", color: "violet", icon: "📞", items: [
        "CALL label ≡ PUSH rip_next ; JMP label — saves return address.",
        "RET ≡ POP rip — restores saved return address into RIP.",
        "After CALL, RSP is misaligned by 8 (return address pushed).",
        "Function must restore RSP to entry value before RET.",
      ]},
      { heading: "ABI & Calling Convention", color: "amber", icon: "🏗️", items: [
        "System V AMD64 integer args: RDI, RSI, RDX, RCX, R8, R9. Extra → stack.",
        "Return value: RAX (and RDX for large returns).",
        "Callee-saved (must preserve): RBX, RBP, R12–R15.",
        "Caller-saved (can clobber): RAX, RCX, RDX, RSI, RDI, R8–R11.",
        "Stack frame: PUSH RBP; MOV RBP, RSP; SUB RSP, N allocates N bytes.",
        "LEAVE ≡ MOV rsp, rbp ; POP rbp.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Windows x64 ABI differs: first 4 args in RCX, RDX, R8, R9 + 32-byte shadow.",
        "Callee must save RBX if used — or caller's value is destroyed.",
        "Local variables at negative offsets from RBP: [rbp–8], [rbp–16], etc.",
      ]},
    ],
  },
  {
    number: 8, short: "NASM Preprocessor & Macros",
    title: "Topic 8 – NASM Preprocessor & Macros",
    overview: "NASM's macro system runs at assembly time, enabling code reuse and conditional assembly with zero runtime overhead.",
    sections: [
      { heading: "Constants", color: "indigo", icon: "📌", items: [
        "%define NAME value — text substitution (like C #define).",
        "%assign NAME expr — numeric constant evaluated at assembly time.",
        "BUFSIZE EQU 256 — symbol constant (cannot redefine).",
        "%define can take params: %define SQ(x) ((x)*(x))",
      ]},
      { heading: "Multi-Line Macros", color: "violet", icon: "🧩", items: [
        "%macro NAME nargs ... %endmacro — define with nargs arguments.",
        "Arguments accessed as %1, %2, … inside body.",
        "%%label — local label unique per expansion (avoids redefinition errors).",
        "Macros expand inline — no call overhead.",
      ]},
      { heading: "Conditionals & Includes", color: "emerald", icon: "🔀", items: [
        "%include 'file.asm' — include another file at assembly time.",
        "%ifdef NAME / %ifndef NAME / %else / %endif — conditional assembly.",
        "%if expr / %elif expr — numeric conditional.",
        "Include guards: %ifndef HEADER / %define HEADER / ... / %endif",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "%define is purely textual — no type checking.",
        "%%labels are local per expansion — without %% a redefinition error occurs.",
        "Macros vs procedures: macros inline code (larger binary); procedures have call overhead.",
      ]},
    ],
  },
  {
    number: 9, short: "STRUC & Alignment",
    title: "Topic 9 – STRUC, ISTRUC, Alignment",
    overview: "NASM STRUC defines memory layout templates like C structs. Alignment ensures efficient access; misaligned reads can cause performance hits or faults on some architectures.",
    sections: [
      { heading: "STRUC & ISTRUC", color: "indigo", icon: "🏛️", items: [
        "STRUC name / ENDSTRUC — defines field offsets only. No memory allocated.",
        ".field: RESB/RESW/RESD/RESQ n — reserves space per field.",
        "Field offsets: name.field (e.g. Point.x, Point.y).",
        "ISTRUC name / IEND — instantiates struct in data section.",
        "AT name.field, db/dw/dd/dq value — sets each field in ISTRUC.",
      ]},
      { heading: "Alignment", color: "violet", icon: "📐", items: [
        "Natural alignment: n-byte type at address divisible by n.",
        "int (4B) → address multiple of 4. double (8B) → multiple of 8.",
        "ALIGN n — pads to next multiple-of-n boundary (NOP bytes in code).",
        "ALIGNB n — pads with 0 bytes (for data sections).",
        "Misaligned access: allowed on x86 but slower.",
      ]},
      { heading: "times Directive", color: "amber", icon: "🔢", items: [
        "times N db 0 — N zero bytes.",
        "$ = current address. $$ = start of section.",
        "Padding to struct size: times Point_size – ($ – Point) db 0",
        "times N instruction — repeat instruction N times inline.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "STRUC creates offsets, not data — actual data from ISTRUC or DB/RES*.",
        "Without ALIGN, struct fields can be misaligned after odd-sized fields.",
        "C compilers auto-pad structs; NASM structs do not — must add ALIGN manually.",
      ]},
    ],
  },
  {
    number: 10, short: "Data Types & Arrays",
    title: "Topic 10 – Basic Data Types & Arrays",
    overview: "C types have defined ranges but implementation-defined sizes. Arrays are contiguous memory blocks; pointer arithmetic and array indexing are identical at machine level.",
    sections: [
      { heading: "C Type Sizes (x86-64 Linux)", color: "indigo", icon: "📏", items: [
        "char: 1B. short: 2B. int: 4B. long: 8B (Linux 64-bit). long long: 8B.",
        "float: 4B. double: 8B. Pointer: 8B. sizeof(void*) == sizeof(size_t) == 8.",
        "Use <stdint.h>: int32_t, uint64_t, etc. for portable exact sizes.",
      ]},
      { heading: "Arrays & Pointer Arithmetic", color: "violet", icon: "🗃️", items: [
        "Array = contiguous bytes. int a[5] allocates 20 bytes.",
        "a[i] ≡ *(a + i). Pointer +1 advances by sizeof(*ptr), not 1 byte.",
        "Address of a[i] = base + i × sizeof(element).",
        "2D array int a[R][C]: row-major. a[r][c] at (r×C + c) × sizeof(int).",
      ]},
      { heading: "C Strings", color: "emerald", icon: "📝", items: [
        "String = null-terminated char array: 'H','i','\\0' in 3 bytes.",
        "strlen() counts until '\\0', does not include it.",
        "char s[] = \"hello\" — copy to stack (modifiable). char *s = \"hello\" — pointer to rodata.",
        "String literals in read-only segment — modifying them is UB.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Off-by-one: null terminator needs 1 extra byte. \"hello\" needs 6 bytes.",
        "long is 4 bytes on Windows 64-bit (LLP64) but 8 bytes on Linux 64-bit (LP64).",
        "sizeof(array) ÷ sizeof(element) = count — works ONLY in scope of declaration.",
      ]},
    ],
  },
  {
    number: 11, short: "Memory Layout",
    title: "Topic 11 – Memory Layout for Running Application",
    overview: "Every process has a virtual address space with well-defined segments. Knowing where code, globals, heap, and stack live helps debug crashes and understand buffer overflows.",
    sections: [
      { heading: "Segments", color: "indigo", icon: "🗂️", items: [
        "Text: executable code, read-only. Starts at low address.",
        "Data: initialized global and static variables (e.g. int g = 5;).",
        "BSS: uninitialized globals/statics — zeroed by OS at startup.",
        "Heap: dynamic memory (malloc/free). Grows upward from BSS.",
        "Stack: local variables, return addresses. Grows downward from high address.",
        "mmap region: between heap and stack — shared libs, file mappings.",
      ]},
      { heading: "Heap vs Stack", color: "violet", icon: "🆚", items: [
        "Stack allocation: implicit, instant (adjust RSP). Freed on function return.",
        "Heap: explicit (malloc → brk/mmap syscall). Must free manually.",
        "Stack overflow: RSP hits guard page → SIGSEGV.",
        "Stack default ~8 MB on Linux. Heap can grow to available RAM + swap.",
      ]},
      { heading: "Layout Details", color: "amber", icon: "🔗", items: [
        "ELF sections .text, .data, .bss, .rodata map to runtime segments.",
        ".rodata: string literals, const globals — write-protected.",
        "ASLR: randomizes base addresses at load time for security.",
        "Stack canary: sentinel between locals and return address — detects overflow.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "BSS zeroed at startup — do not confuse with random uninitialized stack values.",
        "Global int g; → BSS. Global int g = 0; → also BSS (compiler optimization).",
        "Stack grows DOWN; heap grows UP — they meet in middle if both very large.",
        "Writing past array end on stack overwrites the return address (classic exploit).",
      ]},
    ],
  },
  {
    number: 12, short: "Cache Memory",
    title: "Topic 12 – Memory Hierarchy: Cache",
    overview: "Cache exploits locality to bridge the latency gap between fast CPUs and slow DRAM. Cache-friendly code can be 10–100× faster.",
    sections: [
      { heading: "Locality", color: "indigo", icon: "📍", items: [
        "Temporal locality: recently accessed data accessed again soon (loops, hot vars).",
        "Spatial locality: data near recent access accessed soon (arrays, structs).",
        "Cache line: unit of transfer between cache and DRAM. Typically 64 bytes on x86.",
        "Accessing 1 byte loads entire 64-byte line — nearby data comes for free.",
        "Sequential array access = excellent spatial locality. Linked list traversal = poor.",
      ]},
      { heading: "Cache Structure", color: "violet", icon: "🏗️", items: [
        "L1 (~32 KB, ~4 cycles), L2 (~256 KB, ~12 cycles), L3 (~MB, ~40 cycles).",
        "DRAM: ~100–200 cycles. Disk: millions of cycles.",
        "Direct-mapped: each address maps to exactly one cache set.",
        "N-way set-associative: each set has N slots. Modern CPUs: 4–16 way.",
        "Fully associative: any line anywhere — used for TLBs.",
      ]},
      { heading: "Write Policies", color: "amber", icon: "✏️", items: [
        "Write-through: write to cache AND memory simultaneously.",
        "Write-back: write only to cache; flush on eviction (dirty bit).",
        "LRU eviction: evict least recently used line.",
        "Miss types: cold (first access), capacity (cache too small), conflict (wrong set).",
      ]},
      { heading: "Performance Tips", color: "emerald", icon: "🚀", items: [
        "Row-major 2D array traversal is cache-friendly (C/C++ store row by row).",
        "Column-major jumps by row_size × sizeof(element) — cache unfriendly.",
        "False sharing: two threads write to different variables in same cache line → thrash.",
        "Fix false sharing: pad variables to 64-byte alignment.",
      ]},
    ],
  },
  {
    number: 13, short: "DRAM",
    title: "Topic 13 – Memory Hierarchy: DRAM",
    overview: "DRAM stores bits as capacitor charges — dense and cheap but slow and requiring refresh. Understanding DRAM internals explains why access patterns matter.",
    sections: [
      { heading: "DRAM vs SRAM", color: "indigo", icon: "💾", items: [
        "DRAM: 1 transistor + 1 capacitor per bit. Dense, cheap, ~50–100 ns.",
        "SRAM: 6 transistors per bit (flip-flop). Fast (~1 ns), expensive — used for cache.",
        "DRAM needs periodic refresh (capacitor leaks) every ~64 ms.",
        "Refresh pauses access — causes periodic latency spikes.",
      ]},
      { heading: "DRAM Organization", color: "violet", icon: "🔲", items: [
        "2D array of cells: rows × columns.",
        "RAS (Row Address Strobe) sent first, then CAS (Column Address Strobe).",
        "CAS latency (CL): cycles from column address to data.",
        "Burst mode: after activating a row, column accesses are fast (row stays open).",
        "Banks: independent subarrays allow overlapping accesses.",
      ]},
      { heading: "Modern DRAM", color: "amber", icon: "📡", items: [
        "DDR4/DDR5: Double Data Rate — transfers on both clock edges.",
        "Memory controller now inside CPU (since ~2009).",
        "Bandwidth = bus width × clock × 2. DDR4-3200: 25.6 GB/s.",
        "Latency remains ~50–100 ns regardless of DDR generation.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Higher DDR number = more bandwidth but NOT lower latency.",
        "Row buffer: last opened DRAM row cached — re-access same row is faster.",
        "DRAM volatile — data lost on power off. Unlike Flash/SSD.",
      ]},
    ],
  },
  {
    number: 14, short: "HDD & SSD",
    title: "Topic 14 – Memory Hierarchy: HDD and SSD",
    overview: "Persistent storage retains data without power. HDDs use mechanical movement; SSDs use NAND flash. Their access characteristics drive I/O performance decisions.",
    sections: [
      { heading: "HDD Structure", color: "indigo", icon: "💿", items: [
        "Platters: spinning magnetic disks (5400–15000 RPM).",
        "Track: concentric circle on platter. Sector: smallest unit (512B or 4KB).",
        "Seek time: move head to correct track (~3–10 ms average).",
        "Rotational latency: wait for sector to rotate under head (~0–8 ms avg).",
        "Total access time ≈ seek + rotational + transfer. Typically 5–15 ms.",
      ]},
      { heading: "SSD (NAND Flash)", color: "violet", icon: "⚡", items: [
        "No moving parts. Read latency ~0.1 ms. Write ~0.1–1 ms.",
        "NAND flash: written in pages (~4–16 KB), erased in blocks (~256 pages).",
        "Must erase before rewrite — write amplification degrades performance.",
        "Wear leveling: controller spreads writes to prevent cell wear-out.",
        "SLC (1b/cell) fastest/durable. TLC (3b), QLC (4b) denser but slower.",
      ]},
      { heading: "Latency Comparison", color: "amber", icon: "📊", items: [
        "L1=1ns < L2=5ns < L3=20ns < DRAM=60ns < SSD=100µs < HDD=10ms",
        "Bandwidth: DRAM ~50 GB/s, NVMe SSD ~7 GB/s, SATA SSD ~500 MB/s, HDD ~200 MB/s",
        "HDD: sequential read >> random read (seek dominates random I/O).",
        "SSD: random read ≈ sequential read (no seek penalty).",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "SSD writes can be slow if blocks need garbage collection first.",
        "TRIM tells SSD which blocks are free so it can pre-erase them.",
        "HDD capacity cheaper than SSD; DRAM most expensive per GB.",
      ]},
    ],
  },
  {
    number: 15, short: "Linkers & Libraries",
    title: "Topic 15 – Linkers, Symbols, Libraries",
    overview: "Compilation turns source into executable through four stages. The linker resolves cross-file references and decides how libraries are incorporated.",
    sections: [
      { heading: "Compilation Pipeline", color: "indigo", icon: "🔨", items: [
        "1. Preprocessing: expand macros, #include, #ifdef → .i file.",
        "2. Compilation: C to assembly → .s file.",
        "3. Assembly: assembly to machine code → .o (object file).",
        "4. Linking: combine .o, resolve symbols → executable.",
        "Object file: code + data + relocation entries + symbol table.",
      ]},
      { heading: "Symbols & Resolution", color: "violet", icon: "🔗", items: [
        "Strong symbol: defined function or initialized global. Only one per name.",
        "Weak symbol: uninitialized global or __attribute__((weak)). Can be overridden.",
        "Two strong symbols with same name → linker error.",
        "One strong + weak → use strong. Two weak → pick one.",
        "nm tool: T = text, U = undefined, D = data.",
      ]},
      { heading: "Static vs Dynamic Libraries", color: "amber", icon: "📦", items: [
        "Static (.a): archive of .o files. Linker copies into executable.",
        "Dynamic (.so/.dll): loaded at runtime. Not copied.",
        "Static: self-contained, no runtime deps, slightly faster calls.",
        "Dynamic: smaller executables, shared memory across processes.",
        "PLT + GOT: mechanism for dynamic function calls.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Static lib order matters: define libs AFTER object files that use them.",
        "LD_PRELOAD can inject .so that overrides symbols (e.g. malloc wrappers).",
        "ldd shows runtime dependencies. Missing .so → 'not found' at runtime.",
      ]},
    ],
  },
  {
    number: 16, short: "Exceptions & Interrupts",
    title: "Topic 16 – Asynchronous & Synchronous Exceptions",
    overview: "The CPU transfers to OS in four situations: hardware interrupts, traps, faults, and aborts. The OS handles them via the Interrupt Descriptor Table (IDT).",
    sections: [
      { heading: "Exception Classes", color: "indigo", icon: "⚡", items: [
        "Interrupt (async): from external hardware — timer, keyboard, NIC. Not caused by current instruction.",
        "Trap (sync, intentional): syscall (int 0x80 / SYSCALL), breakpoint (int3).",
        "Fault (sync, recoverable): page fault, divide-by-zero, segment fault. Same instruction retried.",
        "Abort (sync, unrecoverable): hardware error or double fault. Must terminate.",
        "Key: interrupts & traps resume at NEXT instruction; faults retry SAME instruction.",
      ]},
      { heading: "Exception Mechanism", color: "violet", icon: "🔄", items: [
        "IDT: array of 256 gate descriptors. IDTR register points to IDT base.",
        "On exception: CPU saves context (RIP, CS, RFLAGS, RSP) on kernel stack.",
        "CPU looks up IDT entry, jumps to handler in kernel mode (ring 0).",
        "IRET: returns from handler, restores saved context.",
      ]},
      { heading: "Kernel vs User Mode", color: "amber", icon: "🔒", items: [
        "Ring 0 (kernel): full hardware access, privileged instructions.",
        "Ring 3 (user): restricted — cannot directly access I/O, modify page tables.",
        "Syscall: controlled ring 3 → ring 0 via SYSCALL/SYSRET or int 0x80.",
        "Linux syscall number in RAX. Args in RDI, RSI, RDX, R10, R8, R9.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Page fault is a FAULT (retried), not abort — page loaded then instruction retried.",
        "Division by zero = #DE fault. Fires before instruction completes.",
        "Double fault: exception during exception handling → abort.",
      ]},
    ],
  },
  {
    number: 17, short: "Processes & Threads",
    title: "Topic 17 – Processes, Threads, Race Conditions",
    overview: "A process is an isolated running program instance. Threads share address space but have independent stacks. Race conditions arise when threads access shared data without synchronization.",
    sections: [
      { heading: "Processes", color: "indigo", icon: "🖥️", items: [
        "Process: program in execution with own address space, file descriptors, PID.",
        "fork(): creates child = copy of parent. Returns child PID to parent, 0 to child.",
        "exec(): replaces current process image with new program. Same PID.",
        "wait()/waitpid(): parent waits for child; collects exit status.",
        "Zombie: terminated child whose parent hasn't called wait. Orphan: child whose parent died.",
      ]},
      { heading: "Threads", color: "violet", icon: "🧵", items: [
        "Thread: lightweight execution context. Shares code, heap, globals with process.",
        "Each thread has own: stack, registers, program counter, thread-local storage.",
        "pthreads: pthread_create, pthread_join, pthread_mutex_lock/unlock.",
        "Thread creation cheaper than fork — no address space duplication.",
      ]},
      { heading: "Race Conditions", color: "red", icon: "🏁", items: [
        "Race condition: outcome depends on non-deterministic thread interleaving.",
        "counter++ compiles to READ–INCREMENT–WRITE. Two threads can interleave.",
        "Critical section: code accessing shared data — must not run concurrently.",
        "TOCTOU: check and use not atomic — another thread can change state in between.",
        "volatile does NOT provide synchronization — use mutexes or atomics.",
      ]},
      { heading: "Exam Traps", color: "amber", icon: "⚠️", items: [
        "fork() duplicates file descriptors — both parent and child can read/write same files.",
        "After exec(), old code/data/stack replaced — no return to caller.",
        "Threads share heap but have separate stacks — locals are thread-safe.",
      ]},
    ],
  },
  {
    number: 18, short: "Signals & setjmp",
    title: "Topic 18 – Signals, Signal Handlers, Nonlocal Jumps",
    overview: "Signals are software interrupts sent to processes. setjmp/longjmp provide cross-function jumps for error recovery.",
    sections: [
      { heading: "Signals", color: "indigo", icon: "📡", items: [
        "SIGINT (Ctrl+C), SIGTERM (graceful stop), SIGKILL (cannot be caught), SIGSEGV (segfault), SIGCHLD (child exited), SIGALRM (timer).",
        "Default actions: terminate, terminate+core, stop, continue, ignore.",
        "signal(SIGINT, handler) or sigaction() — install handler.",
        "Signal mask: blocked signals remain pending (sigprocmask).",
      ]},
      { heading: "Signal Handlers", color: "violet", icon: "🔔", items: [
        "Handler runs asynchronously — can interrupt any instruction.",
        "Only async-signal-safe functions safe in handlers (write(), _exit()).",
        "Unsafe: printf, malloc, any function using locks.",
        "Pattern: set volatile sig_atomic_t flag in handler, check in main loop.",
      ]},
      { heading: "setjmp / longjmp", color: "amber", icon: "🦘", items: [
        "setjmp(env): saves register state + stack pointer. Returns 0.",
        "longjmp(env, val): restores state, jumps back to setjmp. Returns val.",
        "Used for exception-like error handling in C.",
        "Dangerous: skips destructors and cleanup between call sites.",
        "Locals in function with setjmp should be volatile.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "SIGKILL and SIGSTOP cannot be caught or ignored.",
        "printf in signal handler = UB (not async-signal-safe).",
        "longjmp after setjmp function returns = UB (stack frame gone).",
        "Signals not queued — multiple same signals may merge.",
      ]},
    ],
  },
  {
    number: 19, short: "I/O & stdio",
    title: "Topic 19 – Input/Output, Standard I/O",
    overview: "Unix I/O uses file descriptors as a uniform interface for files, pipes, sockets. The stdio library adds buffering. Understanding buffering explains many surprising output behaviors.",
    sections: [
      { heading: "Unix File Descriptors", color: "indigo", icon: "📁", items: [
        "File descriptor: small non-negative int. 0=stdin, 1=stdout, 2=stderr.",
        "open(path, flags, mode) → fd. read(fd, buf, n). write(fd, buf, n). close(fd).",
        "Everything is a file: regular files, devices, pipes, sockets — same API.",
        "Child inherits parent's open file descriptors after fork.",
      ]},
      { heading: "Buffering in stdio", color: "violet", icon: "🛢️", items: [
        "Fully buffered: flush when buffer full or fflush()/fclose() called. Regular files.",
        "Line buffered: flush on newline or buffer full. Default for stdout to terminal.",
        "Unbuffered: every write goes to kernel immediately. Default for stderr.",
        "setvbuf(stream, buf, mode, size): _IOFBF, _IOLBF, _IONBF.",
      ]},
      { heading: "Pipes & Redirection", color: "amber", icon: "🔀", items: [
        "dup2(oldfd, newfd): redirect newfd to same file as oldfd.",
        "ls > out.txt: open file, dup2(fd, 1) to redirect stdout.",
        "pipe(fds): fds[0]=read end, fds[1]=write end.",
        "read() returns 0 (EOF) when writer closes write end of pipe.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "printf without \\n may not appear if output is fully buffered.",
        "After fork, both parent and child have buffered data → duplicated output. Call fflush before fork.",
        "POSIX read/write can return fewer bytes than requested — always loop.",
      ]},
    ],
  },
  {
    number: 20, short: "Virtual Memory",
    title: "Topic 20 – Virtual Memory & Address Translation",
    overview: "Virtual memory gives each process a large private address space. The MMU translates virtual to physical addresses using page tables, with the TLB as a translation cache.",
    sections: [
      { heading: "Address Translation", color: "indigo", icon: "🗺️", items: [
        "VA → PA via page table walk.",
        "Page: fixed block of memory, typically 4 KB (12-bit offset).",
        "Virtual address = page number | page offset.",
        "x86-64: 4-level page tables (PML4 → PDPT → PD → PT → physical page).",
        "CR3 register holds physical address of current PML4 table.",
      ]},
      { heading: "TLB", color: "violet", icon: "⚡", items: [
        "TLB: small fast cache of recent VA→PA translations.",
        "TLB hit: ~1 cycle. TLB miss: full 4-level walk ~40+ cycles.",
        "TLB flushed on context switch (or with PCID extension, selectively).",
        "Huge pages (2MB, 1GB): fewer TLB entries for same memory.",
      ]},
      { heading: "Page Faults & Demand Paging", color: "amber", icon: "⚠️", items: [
        "Page fault (#PF): page not in RAM or access rights violated.",
        "Minor fault: page in swap — OS loads it, retries instruction.",
        "Major fault: page on disk — expensive I/O needed.",
        "Copy-on-Write (CoW): fork shares read-only pages; copy made on write.",
        "Page table entry bits: present, read/write, user/supervisor, accessed, dirty.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Segfault = page fault with protection violation (write to read-only, null deref).",
        "VA in 64-bit: only 48 bits used (canonical form) — not full 64 bits.",
        "TLB flush on every context switch is expensive — OS minimizes switches.",
        "Swap space ≠ virtual memory. Swap is backing store for evicted pages.",
      ]},
    ],
  },
  {
    number: 21, short: "Concurrent Programming",
    title: "Topic 21 – Concurrent Programming",
    overview: "Concurrent programming requires explicit synchronization. Mutexes, semaphores, and condition variables are the primary tools. Deadlock is the most dangerous failure mode.",
    sections: [
      { heading: "Mutexes", color: "indigo", icon: "🔐", items: [
        "Mutex: mutual exclusion lock. Only one thread holds at a time.",
        "pthread_mutex_lock: blocks until acquired. pthread_mutex_unlock: releases.",
        "Spinlock: busy-waits instead of sleeping. Fast for short critical sections.",
      ]},
      { heading: "Semaphores", color: "violet", icon: "🚦", items: [
        "Semaphore: counter ≥ 0. sem_wait() decrements (blocks if 0). sem_post() increments.",
        "Binary semaphore (0 or 1): equivalent to mutex.",
        "Counting semaphore: controls access to N resources.",
        "Producer-consumer: producer posts, consumer waits.",
      ]},
      { heading: "Deadlock", color: "red", icon: "💀", items: [
        "Deadlock: circular wait — each thread holds resource needed by next.",
        "Coffman conditions (all must hold): mutual exclusion, hold-and-wait, no preemption, circular wait.",
        "Prevention: always acquire locks in fixed global order.",
        "Livelock: threads change state but make no progress.",
      ]},
      { heading: "Condition Variables", color: "emerald", icon: "📢", items: [
        "pthread_cond_wait(cond, mutex): atomically releases mutex and sleeps.",
        "pthread_cond_signal: wake one. pthread_cond_broadcast: wake all.",
        "Always recheck condition in loop (spurious wakeups): while (!ready) cond_wait(…).",
      ]},
    ],
  },
  {
    number: 22, short: "Parallelism & Synchronization",
    title: "Topic 22 – Parallelism & Synchronization",
    overview: "Parallelism uses multiple cores simultaneously. Amdahl's law limits achievable speedup. Memory consistency models and atomic operations underpin correct parallel code.",
    sections: [
      { heading: "Parallelism Types", color: "indigo", icon: "⚙️", items: [
        "Data parallelism: same operation on different data (SIMD, parallel for).",
        "Task parallelism: different tasks on different cores.",
        "OpenMP: #pragma omp parallel for — compiler parallelizes loop.",
        "SIMD (SSE/AVX): process 4–16 floats per instruction.",
      ]},
      { heading: "Amdahl's Law", color: "violet", icon: "📈", items: [
        "Speedup = 1 / (S + (1–S)/P). S = serial fraction, P = processors.",
        "10% serial + 8 cores → speedup ≤ 1 / (0.1 + 0.9/8) ≈ 4.7×",
        "Serial portion dominates at high P — diminishing returns.",
        "Gustafson's law: if problem scales with P, speedup ≈ P – S×(P–1).",
      ]},
      { heading: "Memory Models & Atomics", color: "amber", icon: "🔄", items: [
        "Sequential consistency: all threads see operations in same global order.",
        "Relaxed consistency: hardware/compiler may reorder — need memory barriers.",
        "Atomic ops: read-modify-write in one step (CAS, fetch-and-add).",
        "C11/C++11 atomics: _Atomic / std::atomic with specified memory order.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "False sharing: threads write different vars on same 64-byte cache line → thrash.",
        "Fix: pad to alignas(64) so each var is on its own cache line.",
        "Thundering herd: many threads wake on same event → all contend for lock.",
      ]},
    ],
  },
  {
    number: 23, short: "Virtual Machines",
    title: "Topic 23 – Virtual Machines",
    overview: "A VM runs an entire OS as a process on host hardware. Containers provide lighter isolation. Both are fundamental to modern cloud infrastructure.",
    sections: [
      { heading: "Hypervisors", color: "indigo", icon: "🖥️", items: [
        "Type 1 (bare-metal): runs directly on hardware. VMware ESXi, Xen, KVM.",
        "Type 2 (hosted): runs on top of host OS. VirtualBox, VMware Workstation.",
        "Type 1 faster (no host OS overhead). Type 2 easier to set up.",
        "Hypervisor multiplexes physical CPU, RAM, I/O among guest VMs.",
      ]},
      { heading: "Virtualization Techniques", color: "violet", icon: "🔧", items: [
        "Full virtualization: guest OS unmodified. Hypervisor traps privileged instructions.",
        "Paravirtualization: guest modified to call hypervisor (hypercalls) directly.",
        "Hardware-assisted: Intel VT-x / AMD-V. CPU has VMX root/non-root modes.",
        "Extended Page Tables (EPT/NPT): map guest physical → host physical.",
      ]},
      { heading: "Containers vs VMs", color: "amber", icon: "📦", items: [
        "Container: shares host kernel. Isolated via Linux namespaces + cgroups.",
        "VM: full OS stack, own kernel, stronger isolation.",
        "Container overhead: near-zero. VM overhead: ~10% CPU + full OS RAM.",
        "Container startup: ms. VM startup: seconds to minutes.",
        "Docker: namespaces (process/net/fs), cgroups (resource limits), union FS layers.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Containers NOT VMs — they share the host kernel. No kernel isolation.",
        "VM escape: exploit breaking out of VM into hypervisor — critical security issue.",
        "KVM = Linux kernel module. Makes Linux a Type 1 hypervisor when combined with QEMU.",
        "Memory overcommit: hypervisor allocates more RAM than physical — relies on VMs not all using max.",
      ]},
    ],
  },
];

const COLORS: Record<string, { section: string; badge: string; dot: string; chevron: string }> = {
  indigo:  { section: "border-indigo-500/30 bg-indigo-950/25",  badge: "text-indigo-300",  dot: "bg-indigo-400",  chevron: "text-indigo-400"  },
  violet:  { section: "border-violet-500/30 bg-violet-950/25",  badge: "text-violet-300",  dot: "bg-violet-400",  chevron: "text-violet-400"  },
  amber:   { section: "border-amber-500/30 bg-amber-950/25",    badge: "text-amber-300",   dot: "bg-amber-400",   chevron: "text-amber-400"   },
  red:     { section: "border-red-500/30 bg-red-950/25",        badge: "text-red-300",     dot: "bg-red-400",     chevron: "text-red-400"     },
  emerald: { section: "border-emerald-500/30 bg-emerald-950/25",badge: "text-emerald-300", dot: "bg-emerald-400", chevron: "text-emerald-400" },
  orange:  { section: "border-orange-500/30 bg-orange-950/25",  badge: "text-orange-300",  dot: "bg-orange-400",  chevron: "text-orange-400"  },
};

export default function StudyPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const topic = TOPICS[selected];

  function toggleSection(key: string) {
    setOpenSections(prev => {
      const current = prev[key] ?? true;
      return { ...prev, [key]: !current };
    });
  }

  function selectTopic(i: number) {
    setSelected(i);
    setOpenSections({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 bg-slate-950 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <span className="font-semibold text-sm text-slate-200">CS231 Study Guide</span>
        <span className="text-slate-600 hidden sm:inline">·</span>
        <span className="text-slate-500 text-xs hidden sm:inline">23 Topics</span>
      </header>

      {/* Topic selector — horizontal scroll on all screens */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="overflow-x-auto">
          <div className="flex px-4 py-2 gap-1.5 min-w-max">
            {TOPICS.map((t, i) => (
              <button
                key={i}
                onClick={() => selectTopic(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selected === i
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {t.number}. {t.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Topic header */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3 gap-3">
            <span className="text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2.5 py-1 rounded-full flex-shrink-0">
              Topic {topic.number} / 23
            </span>
            <div className="flex items-center gap-3 ml-auto">
              {selected > 0 && (
                <button onClick={() => selectTopic(selected - 1)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  ← Prev
                </button>
              )}
              {selected < TOPICS.length - 1 && (
                <button onClick={() => selectTopic(selected + 1)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Next →
                </button>
              )}
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{topic.title}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{topic.overview}</p>
        </div>

        {/* Sections */}
        <div className="space-y-2.5">
          {topic.sections.map((sec, si) => {
            const key = `${selected}-${si}`;
            const isOpen = openSections[key] ?? true;
            const c = COLORS[sec.color] ?? COLORS.indigo;
            return (
              <div key={si} className={`border rounded-xl overflow-hidden ${c.section}`}>
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{sec.icon}</span>
                    <span className={`font-semibold text-sm ${c.badge}`}>{sec.heading}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${c.chevron} ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <ul className="px-4 pb-4 space-y-2">
                    {sec.items.map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2.5">
                        <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-[7px] ${c.dot}`} />
                        <span className="text-slate-300 text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom nav */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/exam")}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
          >
            <Star className="w-4 h-4" /> Test yourself in Exam
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
    </div>
  );
}
