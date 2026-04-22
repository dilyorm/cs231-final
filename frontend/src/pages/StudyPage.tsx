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

const COLORS: Record<string, { section: string; badge: string; dot: string; chevron: string }> = {
  indigo: { section: "bg-indigo-950/30 border-indigo-500/20", badge: "text-indigo-300", dot: "bg-indigo-400", chevron: "text-indigo-500" },
  violet: { section: "bg-violet-950/30 border-violet-500/20", badge: "text-violet-300", dot: "bg-violet-400", chevron: "text-violet-500" },
  amber:  { section: "bg-amber-950/30 border-amber-500/20",   badge: "text-amber-300",  dot: "bg-amber-400",  chevron: "text-amber-500"  },
  red:    { section: "bg-red-950/30 border-red-500/20",       badge: "text-red-300",    dot: "bg-red-400",    chevron: "text-red-500"    },
};

const TOPICS: TopicData[] = [
  {
    number: 1, short: "Binary & Endianness",
    title: "Topic 1 – Binary Representation, Byte Memory & Byte Ordering",
    overview: "All data is binary. Memory is byte-addressable — each address holds exactly 1 byte. Multi-byte values have two possible layouts: big-endian or little-endian. x86/x86-64 is little-endian.",
    sections: [
      { heading: "Number Systems", color: "indigo", icon: "🔢", items: [
        "Binary (base-2): 11101101₂ = 128+64+32+0+8+4+0+1 = 237₁₀",
        "Hex (base-16): digits 0–9, A–F. 1 hex digit = 4 bits (nibble). 0xED = 14×16+13 = 237₁₀",
        "Binary↔Hex: group bits in 4s from right. 1110|1101 → E|D → 0xED",
        "1 byte = 8 bits = 2 hex digits. int(32-bit) = 4 bytes = 8 hex digits.",
        "Decimal→Binary: divide by 2 repeatedly, collect remainders bottom-up.",
        "Decimal→Hex: divide by 16 repeatedly, or convert via binary (group by 4).",
      ]},
      { heading: "Byte-Oriented Memory", color: "violet", icon: "🧠", items: [
        "Each memory address identifies exactly 1 byte. CPU issues byte-level addresses.",
        "Word size = natural integer/pointer size: x86 → 32-bit (4B), x86-64 → 64-bit (8B).",
        "32-bit CPU: max 2³² = 4 GB directly addressable.",
        "64-bit CPU (x86-64): 48-bit virtual addresses → 256 TB user space.",
        "sizeof(void*) = word size. On x86-64 = 8 bytes.",
        "char=1B, short=2B, int=4B, long(Linux 64-bit)=8B, long long=8B, float=4B, double=8B.",
      ]},
      { heading: "Byte Ordering (Endianness)", color: "amber", icon: "🔄", items: [
        "Big-endian: MSB at lowest address. 0x12345678 at 0x100 → [12][34][56][78]",
        "Little-endian: LSB at lowest address. x86 is little-endian. → [78][56][34][12]",
        "Network byte order = big-endian. htonl()/ntohl() for 32-bit, htons()/ntohs() for 16-bit.",
        "Detect at runtime: union{int i; char c[4];}u={1}; if(u.c[0]==1) → little-endian.",
        "String bytes NOT reordered (each char = 1 byte; endianness only affects multi-byte values).",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Little-endian: address 0x100 holds the LEAST significant byte of a multi-byte value.",
        "Writing to EAX zero-extends upper 32 bits of RAX. Writing to AX does NOT touch upper bits.",
        "nibble=4 bits, byte=8 bits, word=2B (x86 term), DWORD=4B, QWORD=8B.",
        "Endianness only matters for multi-byte values in memory. Single bytes are unaffected.",
        "C: sizeof('A')=1 (char). sizeof(\"A\")=2 (char + null terminator).",
      ]},
    ],
  },
  {
    number: 2, short: "Integer Encoding",
    title: "Topic 2 – Encoding Integers & Integer Arithmetic",
    overview: "Unsigned integers are pure binary. Signed integers use two's complement. Overflow wraps silently. Two's complement negation: flip bits + 1. Division requires sign-extension setup.",
    sections: [
      { heading: "Unsigned & Two's Complement", color: "indigo", icon: "🔢", items: [
        "Unsigned n-bit: range 0 to 2ⁿ-1. All bit patterns non-negative.",
        "Two's complement n-bit: range -2^(n-1) to 2^(n-1)-1. MSB has weight -2^(n-1).",
        "8-bit unsigned: 0–255. 8-bit signed: -128–127.",
        "Negation: flip all bits + 1. E.g. 5=00000101 → 11111010+1=11111011=-5.",
        "Key identity: -x = ~x + 1. Also: ~x = -x - 1.",
        "Sign extension: copy MSB into all new upper bits. Zero extension: fill upper bits with 0.",
        "Casting unsigned↔signed in C keeps bit pattern, reinterprets meaning.",
      ]},
      { heading: "Arithmetic & Overflow", color: "violet", icon: "➕", items: [
        "Addition mod 2ⁿ: same bit operation for unsigned and signed.",
        "Unsigned overflow: result > 2ⁿ-1 → wraps. Carry Flag (CF) set.",
        "Signed overflow: both operands same sign, result opposite sign. Overflow Flag (OF) set.",
        "Arithmetic right shift (SAR): fills with sign bit. Signed divide by 2^k (rounds toward -∞).",
        "Logical right shift (SHR): fills with 0. Unsigned divide by 2^k.",
        "Left shift SHL by k = multiply by 2^k (unsigned and signed).",
        "MUL (unsigned): full result in RDX:RAX. IMUL (signed): same for 1-operand form.",
        "IDIV: dividend in RDX:RAX. Quotient→RAX, Remainder→RDX. CDQ before 32-bit, CQO before 64-bit.",
      ]},
      { heading: "Bit Operations", color: "amber", icon: "⚙️", items: [
        "AND: mask bits. x & 0xFF → lower byte only.",
        "OR: set bits. x | 0x01 → force LSB to 1.",
        "XOR: toggle. x ^ x = 0. XOR eax,eax fastest way to zero register.",
        "NOT: flip all bits. ~0 = -1 (signed), 0xFFFFFFFF (unsigned 32-bit). Does NOT set flags.",
        "Test bit k: (x >> k) & 1. Set bit k: x | (1<<k). Clear: x & ~(1<<k). Toggle: x ^ (1<<k).",
        "Isolate lowest set bit: x & (-x).",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "INT_MIN negation overflows: -(-2147483648) = -2147483648 in two's complement.",
        "Casting signed -1 to uint32 = 4294967295. Bit pattern unchanged.",
        "IDIV requires CDQ/CQO first or RDX contains garbage → wrong quotient.",
        "SAR -9,1 = -5 (rounds toward -∞, not toward 0). Different from C integer division.",
        "Shift by ≥ word size: undefined behavior in C (e.g. 1U<<32 on 32-bit int).",
        "INC/DEC do NOT set CF. ADD/SUB do.",
      ]},
    ],
  },
  {
    number: 3, short: "Floating Point",
    title: "Topic 3 – IEEE 754 Floating Point & Rounding",
    overview: "IEEE 754: sign + biased exponent + mantissa. float=32-bit (bias 127), double=64-bit (bias 1023). Special values: ±0, ±∞, NaN, denormals. Default rounding = round-to-even.",
    sections: [
      { heading: "IEEE 754 Structure", color: "indigo", icon: "🔬", items: [
        "Format: (-1)^s × M × 2^E. s=sign, M=mantissa, E=exponent.",
        "float (32-bit): 1 sign | 8 exponent | 23 mantissa. Bias=127. E=exp_bits-127.",
        "double (64-bit): 1 sign | 11 exponent | 52 mantissa. Bias=1023.",
        "Normalized: exp_bits ≠ 0 and ≠ all-1s. Implicit leading 1: M = 1.mantissa_bits.",
        "float exponent range: -126 to +127. Precision: ~7 decimal digits.",
        "double precision: ~15 decimal digits. float range: ~±3.4×10³⁸.",
        "Example: -6.5 = -1.101₂ × 2². s=1, exp=129=10000001, mantissa=10100...0",
      ]},
      { heading: "Special Values & Denormals", color: "violet", icon: "∞", items: [
        "±0: exp=0, mantissa=0. +0 == -0 but 1/+0=+∞, 1/-0=-∞.",
        "±∞: exp=all-1s, mantissa=0. Produced by overflow or div by zero.",
        "NaN: exp=all-1s, mantissa≠0. Any comparison with NaN is false (except !=).",
        "Denormal (subnormal): exp_bits=0, mantissa≠0. No implicit leading 1. E=-126 (float).",
        "Denormals fill the gap near 0 (gradual underflow). Slower on many CPUs.",
        "Smallest positive normalized float: 2^-126 ≈ 1.18×10⁻³⁸.",
      ]},
      { heading: "Rounding & Arithmetic", color: "amber", icon: "🔄", items: [
        "Round-to-even (default): ties round to nearest even. 2.5→2, 3.5→4.",
        "Other modes: truncate (toward 0), ceiling (toward +∞), floor (toward -∞).",
        "Float arithmetic is NOT associative: (a+b)+c ≠ a+(b+c) due to rounding.",
        "NOT distributive: a×(b+c) ≠ a×b + a×c.",
        "int→float: exact if |int| < 2²⁴ (23 mantissa bits). Larger ints lose low bits.",
        "double→float: loses precision. float→double: safe (widening).",
        "FMA (fused multiply-add): computes a×b+c with single rounding. More accurate.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "NaN != NaN is TRUE. Only reliable check: isnan(x) or x != x.",
        "0.1 cannot be represented exactly in binary float — it repeats infinitely.",
        "Overflow → ±∞ (not UB for floats, unlike signed integer overflow in C).",
        "Denormals: exp_bits=0 but E=-126 (not -127). No implicit leading 1.",
        "16777217 (2²⁴+1) rounds to 16777216 as float — loses low bit.",
        "Comparing floats with == almost always wrong. Use fabs(a-b) < epsilon.",
      ]},
    ],
  },
  {
    number: 4, short: "x86/x64 Registers",
    title: "Topic 4 – Intel x86 / x64 Processors & Register File",
    overview: "x86 (IA-32): 8 × 32-bit GPRs. x86-64: 16 × 64-bit GPRs. Writing a 32-bit sub-register zero-extends the upper 32 bits. RFLAGS tracks arithmetic results. RSP = stack pointer.",
    sections: [
      { heading: "CPU Architecture", color: "indigo", icon: "💻", items: [
        "CISC: variable-length instructions (1–15 bytes). Complex addressing modes.",
        "x86 (IA-32): 32-bit mode, max 4 GB RAM, 8 GPRs.",
        "x86-64 (AMD64): 64-bit, backward compatible, 16 GPRs. AMD introduced 2003, Intel adopted.",
        "Rings: ring 0 = kernel (supervisor), ring 3 = user mode. x86 has 4 rings; Linux uses 0 and 3.",
        "Pipelining: fetch → decode → execute → writeback. Modern CPUs out-of-order, superscalar.",
      ]},
      { heading: "Register File", color: "violet", icon: "📋", items: [
        "64-bit GPRs: RAX RBX RCX RDX RSI RDI RBP RSP R8 R9 R10 R11 R12 R13 R14 R15",
        "RAX aliases: EAX(32b) AX(16b) AH(bits 8-15) AL(bits 0-7).",
        "Writing EAX zero-extends RAX upper 32 bits. Writing AX does NOT change upper 48 bits.",
        "RSP = stack pointer (top of stack). RBP = base pointer (frame base). RIP = instruction pointer.",
        "R8–R15 sub-regs: R8D(32b), R8W(16b), R8B(8b).",
        "Caller-saved (volatile): RAX RCX RDX RSI RDI R8–R11.",
        "Callee-saved (preserved): RBX RBP R12–R15.",
        "XMM0–XMM15: 128-bit registers for SSE/AVX float ops.",
      ]},
      { heading: "RFLAGS & Condition Codes", color: "amber", icon: "🚦", items: [
        "CF (Carry): unsigned overflow/borrow.",
        "ZF (Zero): result == 0.",
        "SF (Sign): MSB of result (1 = negative in two's complement).",
        "OF (Overflow): signed overflow (sign of result is wrong).",
        "CMP a,b: computes a-b, sets flags, discards result.",
        "TEST a,b: computes a AND b, sets flags, discards result.",
        "NOT does NOT set flags. INC/DEC do NOT set CF.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "MOV EAX,1 zeros upper 32 bits of RAX silently. MOV AX,1 does NOT.",
        "INC/DEC preserve CF — use ADD/SUB if CF needed.",
        "RSP must be 16-byte aligned BEFORE CALL (System V ABI). CALL pushes 8B → misaligned inside.",
        "RIP cannot be used directly as GPR. RIP-relative addressing: [RIP+offset].",
        "RFLAGS IF bit: controls whether maskable interrupts accepted. CLI/STI instructions.",
      ]},
    ],
  },
  {
    number: 5, short: "Assembly & Arithmetic",
    title: "Topic 5 – Assembly Language & Arithmetic Operations",
    overview: "NASM uses Intel syntax: opcode dst, src. Arithmetic modifies RFLAGS. MUL/IMUL use RDX:RAX for full result. IDIV requires dividend in RDX:RAX with CDQ/CQO sign-extension.",
    sections: [
      { heading: "NASM Basics & Syntax", color: "indigo", icon: "📝", items: [
        "Intel syntax (NASM): MOV dst, src — destination first. No register prefix.",
        "AT&T syntax (GAS): movl src, dst — source first. Registers prefixed %.",
        "Sections: section .text (code), .data (init data), .bss (uninit data).",
        "global _start (Linux ELF) or global main (C linkage).",
        "Comments: semicolon. ; this is a comment",
        "Size specifiers: BYTE(1B), WORD(2B), DWORD(4B), QWORD(8B).",
        "Memory access: [address]. MOV rax,[rbx] loads 8B at address in rbx.",
      ]},
      { heading: "Arithmetic Instructions", color: "violet", icon: "➕", items: [
        "ADD dst,src → dst = dst+src. SUB dst,src → dst = dst-src. Both set CF ZF SF OF.",
        "INC dst → dst++. DEC dst → dst--. NEG dst → dst = -dst (two's complement).",
        "IMUL reg,src → signed. IMUL rax (1-op): RDX:RAX = RAX×rax.",
        "IMUL dst,src,imm → dst = src×imm (3-op, no RDX involved).",
        "MUL src → unsigned: RDX:RAX = RAX×src.",
        "IDIV src → signed: CDQ/CQO first. Quotient→RAX, Remainder→RDX.",
        "CDQ: sign-extends EAX into EDX:EAX (32-bit). CQO: sign-extends RAX into RDX:RAX (64-bit).",
        "XCHG a,b: swap. Has implicit LOCK on memory operands.",
      ]},
      { heading: "Logical & Shift", color: "amber", icon: "⚙️", items: [
        "AND dst,src — bitwise AND. OR dst,src — bitwise OR. XOR dst,src — bitwise XOR.",
        "NOT dst — flip all bits. Does NOT set flags.",
        "XOR reg,reg — fastest way to zero register (also zero-extends to full 64-bit if 32-bit).",
        "SHL dst,count — shift left (fill 0). Multiply by 2^count.",
        "SHR dst,count — logical shift right (fill 0). Unsigned divide by 2^count.",
        "SAR dst,count — arithmetic shift right (fill sign bit). Signed divide by 2^count.",
        "ROL/ROR — rotate left/right. Bits wrap around.",
        "Count operand: immediate or CL register only.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "IDIV — must CDQ/CQO first. Without it, RDX has garbage → wrong result.",
        "NOT sets no flags. NEG sets ZF (result=0) and CF (always unless result=0).",
        "XOR eax,eax zeros upper 32 bits of RAX (unlike MOV AX,0).",
        "IMUL eax,ebx,5 → 3-op form, no RDX. IMUL eax (1-op) → RDX:EAX = EAX×EAX.",
        "SAR arithmetic rounds toward -∞. C signed >> is implementation-defined.",
        "MUL/IMUL 1-operand: full 128-bit result in RDX:RAX.",
      ]},
    ],
  },
  {
    number: 6, short: "Addressing & Control Flow",
    title: "Topic 6 – Addressing Modes, MOV/LEA, Jumps, Loops & Switch",
    overview: "x86-64 addressing: base + index×scale + displacement. MOV loads values; LEA computes addresses without memory access. Conditional jumps use RFLAGS. Switch compiles to jump tables.",
    sections: [
      { heading: "Addressing Modes", color: "indigo", icon: "📍", items: [
        "Immediate: MOV rax,42 — literal in instruction.",
        "Register: MOV rax,rbx — from register.",
        "Memory indirect: MOV rax,[rbx] — value at address in rbx.",
        "Base+disp: MOV rax,[rbx+8] — struct field access.",
        "Base+index×scale+disp: MOV rax,[rbx+rcx*8+16] — full form.",
        "Scale must be 1, 2, 4, or 8. Index register cannot be RSP.",
        "RIP-relative: [rel symbol] — position-independent code (64-bit).",
      ]},
      { heading: "MOV vs LEA", color: "violet", icon: "🏷️", items: [
        "MOV rax,[expr] — loads VALUE from memory at computed address.",
        "LEA rax,[expr] — loads COMPUTED ADDRESS itself. NO memory access.",
        "LEA rax,[rbx+rcx*4+8] → rax = rbx+rcx×4+8. Pure integer arithmetic.",
        "LEA common uses: fast multiply by non-power-of-2 (LEA rax,[rax+rax*2]=×3), address calc.",
        "MOVZX: move with zero-extension. MOVSX: move with sign-extension.",
        "MOV DWORD to 32-bit reg automatically zero-extends to 64-bit.",
      ]},
      { heading: "Jumps, Loops & Switch", color: "amber", icon: "🔀", items: [
        "JMP label — unconditional.",
        "CMP a,b → flags from a-b. TEST a,b → flags from a AND b.",
        "JE/JZ(ZF=1), JNE/JNZ(ZF=0), JL(SF≠OF), JG(ZF=0,SF=OF), JLE, JGE (signed).",
        "JB/JNAE(CF=1), JA/JNBE(CF=0,ZF=0) — unsigned comparisons.",
        "FOR: init; top: CMP count,limit; JGE done; body; INC count; JMP top.",
        "WHILE: top: CMP; JGE done; body; JMP top. DO-WHILE: body; CMP; JL top.",
        "LOOP: DEC RCX; JNZ label. Implicit counter in RCX.",
        "SWITCH jump table: array of code addresses. JMP [table+rax*8]. Dense cases only.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "LEA does NOT access memory — it only computes the address.",
        "JL is signed (SF≠OF). JB is unsigned (CF=1). Wrong choice = wrong branch.",
        "After CMP a,b: JL means a<b (signed). JB means a<b (unsigned).",
        "LOOP: if RCX=0 before LOOP, decrements to 2⁶⁴-1 → runs 2⁶⁴ times.",
        "Switch sparse cases: compiler uses chain of CMP+JE, not jump table.",
      ]},
    ],
  },
  {
    number: 7, short: "Stack & Procedures",
    title: "Topic 7 – Stack, Calling Conventions, Stack Frames & Recursion",
    overview: "Stack grows downward. CALL pushes return address; RET pops it. System V AMD64 ABI: args in RDI RSI RDX RCX R8 R9, return in RAX. RSP must be 16-byte aligned before CALL.",
    sections: [
      { heading: "Stack Mechanics", color: "indigo", icon: "📚", items: [
        "Stack grows HIGH→LOW. RSP = lowest used address (top of stack).",
        "PUSH src: RSP -= 8; [RSP] = src",
        "POP dst: dst = [RSP]; RSP += 8",
        "CALL label: PUSH RIP (next instr addr); JMP label",
        "RET: POP RIP; JMP RIP",
        "LEAVE = MOV RSP,RBP; POP RBP. Replaces manual epilogue.",
        "Stack overflow: RSP below guard page → SIGSEGV. Default stack ~8 MB Linux.",
      ]},
      { heading: "System V AMD64 Calling Convention", color: "violet", icon: "📞", items: [
        "Integer/pointer args 1–6: RDI RSI RDX RCX R8 R9 (memorize this order).",
        "Float args 1–8: XMM0–XMM7.",
        "More than 6 integer args: extras pushed on stack right-to-left.",
        "Return value: integer/pointer → RAX. 128-bit → RDX:RAX. Float → XMM0.",
        "Caller-saved (callee may clobber): RAX RCX RDX RSI RDI R8–R11.",
        "Callee-saved (must preserve): RBX RBP R12–R15.",
        "RSP must be 16-byte aligned BEFORE the CALL. After CALL, RSP is 8-byte (misaligned by CALL push).",
        "Red zone: 128 bytes below RSP usable by leaf functions without adjusting RSP.",
      ]},
      { heading: "Stack Frame & Recursion", color: "amber", icon: "🔁", items: [
        "Prologue: PUSH RBP; MOV RBP,RSP; SUB RSP,N (reserve N bytes for locals).",
        "Epilogue: MOV RSP,RBP; POP RBP; RET (or LEAVE; RET).",
        "Frame layout from RBP upward: [RBP+16]=7th arg, [RBP+8]=return addr, [RBP+0]=saved RBP.",
        "Locals below RBP: [RBP-8]=local1, [RBP-16]=local2, ...",
        "Recursion: each call creates new stack frame. No shared locals between calls.",
        "Tail call: last action is a CALL → compiler can JMP (no new frame).",
        "Example factorial: if n<=1 ret 1; else: SUB RSP,8; save rdi; CALL fact(n-1); MUL saved_n; ret.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "After CALL, RSP is misaligned by 8. PUSH RBP in prologue realigns to 16.",
        "Callee must save RBX R12–R15 if used. Failing to restore = caller gets corrupted value.",
        "[RBP+8] = return address. [RBP+16] = 7th arg. [RBP-8] = first local.",
        "1st arg is RDI, NOT RAX. Return goes INTO RAX.",
        "Red zone: only for LEAF functions (no further CALL). Signal delivery can overwrite it.",
      ]},
    ],
  },
  {
    number: 8, short: "NASM Macros",
    title: "Topic 8 – NASM Preprocessor, Single-line & Multi-line Macros",
    overview: "NASM preprocessor runs before assembly. %define = text substitution. %macro/%endmacro = parameterized multi-line macros. Local labels (%%label) avoid duplicate definitions across expansions.",
    sections: [
      { heading: "%define & %assign", color: "indigo", icon: "📌", items: [
        "%define NAME value — text substitution. NAME replaced everywhere in source at use time.",
        "%define SQUARE(x) ((x)*(x)) — function-like, parameter in parens.",
        "%assign NAME expr — evaluates expression at define time to a number.",
        "%undef NAME — remove definition.",
        "%xdefine — expands parameters at define time (eager), not at use time (lazy like %define).",
        "Predefined macros: __NASM_MAJOR__, __BITS__, __FILE__, __LINE__.",
      ]},
      { heading: "%macro / %endmacro", color: "violet", icon: "📦", items: [
        "%macro name nparams ... %endmacro — define multi-line macro.",
        "Parameters: %1, %2, ... %9. For 10+: %{10}.",
        "Variable args: %macro name 1-* (at least 1). %0 = actual arg count.",
        "%%label — local label unique per expansion. Prevents 'duplicate label' error.",
        "Example: %macro SWAP 2 / push %1 / push %2 / pop %1 / pop %2 / %endmacro",
        "Macros can call other macros and use directives inside.",
      ]},
      { heading: "Conditionals & %include", color: "amber", icon: "🔀", items: [
        "%include 'file.asm' — textually inserts file content at that point.",
        "%ifdef NAME / %else / %endif — conditional assembly if NAME defined.",
        "%ifndef NAME / %endif — if NOT defined. Use for include guards.",
        "%if expr / %elif / %else / %endif — numeric condition.",
        "%rep N / ... / %endrep — repeat block N times (compile-time, not runtime).",
        "Include guard: %ifndef _MYFILE_INC / %define _MYFILE_INC / code / %endif",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "%define is TEXT substitution — no evaluation. %assign evaluates. Confusing them = bug.",
        "%%label needed inside macros. Multiple expansions without %% → duplicate label error.",
        "Macro does NOT save registers automatically. Modified caller-saved regs are gone.",
        "%0 = number of args actually passed (variadic macros).",
        "%rep duplicates code N times (code size grows). NOT a runtime loop.",
        "NASM macro names are case-sensitive.",
      ]},
    ],
  },
  {
    number: 9, short: "STRUC & Alignment",
    title: "Topic 9 – STRUC, ISTRUC & Alignment Principles",
    overview: "STRUC defines struct layout (no allocation). ISTRUC allocates and initializes. Alignment: field of size N must be at address divisible by N. Padding is added automatically by compilers.",
    sections: [
      { heading: "STRUC & ISTRUC", color: "indigo", icon: "🗂️", items: [
        "STRUC name / .field resX count / ENDSTRUC — template only, no memory allocated.",
        "Access fields by: name.field (gives byte offset). sizeof: name_size.",
        "ISTRUC name / AT name.field, dX value / IEND — allocates+initializes struct.",
        "AT sets specific field. Unset fields initialized to 0.",
        "Example: STRUC Point / .x resd 1 / .y resd 1 / ENDSTRUC → Point.x=0, Point.y=4, Point_size=8",
        "Arrays of structs: label ISTRUC Point / ... / IEND times N (N instances).",
      ]},
      { heading: "Alignment Rules", color: "violet", icon: "📐", items: [
        "Natural alignment: field of size N bytes → address must be multiple of N.",
        "char(1B): any addr. short(2B): even. int(4B): mult of 4. int64(8B): mult of 8.",
        "SIMD (XMM=128b, YMM=256b): 16 or 32-byte aligned.",
        "ALIGN N — insert NOP bytes (code) until current address is multiple of N.",
        "ALIGNB N — insert 0x00 bytes (data sections).",
        "Stack: RSP must be 16-byte aligned before CALL (System V ABI).",
        "Misaligned access: performance penalty (cache line split). Some CPUs (ARM) fault.",
      ]},
      { heading: "Struct Padding", color: "amber", icon: "📏", items: [
        "Compiler adds padding between fields to satisfy alignment.",
        "struct{char a; int b;} → a@0, 3B pad, b@4. sizeof=8 (not 5).",
        "struct{int a; char b;} → a@0, b@4, 3B end pad. sizeof=8.",
        "Struct itself aligns to its largest member. Trailing padding added too.",
        "Optimization: order fields largest-first → minimal padding.",
        "Example: {int(4), short(2), char(1), char(1)} = 8B. vs {char,int,short} = 12B.",
        "__attribute__((packed)) removes padding — risks misaligned access.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "sizeof(struct) ≠ sum of field sizes. Padding makes it larger.",
        "STRUC allocates NO memory. ISTRUC does.",
        "Trailing padding: struct{int,char} has 3 bytes padding at end. sizeof=8 not 5.",
        "ALIGN N: N must be power of 2.",
        "AT in ISTRUC takes offset constant (Point.x=0), not the field name or value.",
      ]},
    ],
  },
  {
    number: 10, short: "Data Types & Arrays",
    title: "Topic 10 – Basic Data Types & Array Organization (1D, 2D, 3D)",
    overview: "NASM data directives: db(1B), dw(2B), dd(4B), dq(8B). Arrays are contiguous. 1D: base+i×E. 2D row-major (C): base+(r×COLS+c)×E. 3D: base+(d×R×C+r×C+c)×E.",
    sections: [
      { heading: "Basic Data Types", color: "indigo", icon: "📋", items: [
        "Initialized: db(1B) dw(2B) dd(4B) dq(8B) dt(10B).",
        "Uninitialized (BSS): resb N, resw N, resd N, resq N — reserves N units.",
        "Multiple values: arr dd 1,2,3,4 — 4 consecutive DWORDs (16 bytes total).",
        "String: msg db 'Hello',10,0 — with newline and null terminator.",
        "Repeat: arr times 10 dd 0 — ten 4-byte zeros.",
        "EQU: LEN EQU $-msg — constant, not in memory, cannot take address.",
        "$ = current address. $$ = start of current section.",
      ]},
      { heading: "1D Arrays", color: "violet", icon: "📊", items: [
        "Element size E bytes. Address of element i: base + i × E.",
        "int array[100]: arr resd 100. arr[i] at arr + i×4.",
        "NASM: MOV eax,[arr + rcx*4] — loads arr[rcx] (4-byte element).",
        "Pointer arithmetic: p++ moves by sizeof(*p) bytes in C.",
        "Valid indices: 0 to N-1. arr[N] is one past end (out of bounds).",
        "Stack array: SUB RSP,N×4; then [RSP+i×4].",
      ]},
      { heading: "2D & 3D Arrays", color: "amber", icon: "🗃️", items: [
        "C 2D arrays: ROW-MAJOR. int a[R][C]: a[r][c] at offset (r×C + c) × sizeof(int).",
        "Address: base + (r×C + c) × 4",
        "NASM: MOV eax,[arr + (r*COLS + c)*4]",
        "3D int a[D][R][C]: a[d][r][c] at (d×R×C + r×C + c) × sizeof(int).",
        "Nested array (array of pointers): a[i] is a pointer → dereference twice.",
        "Fortran/MATLAB: column-major. a[r][c] at (c×R + r) × E.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "resb 100 = 100 bytes. resd 100 = 400 bytes (100 × 4B each).",
        "2D array offset: (r×COLS + c) — uses COLS (width), NOT ROWS.",
        "Row-major: traversing column-first (a[0][0],a[1][0],...) = cache-unfriendly (stride=COLS).",
        "times 10 dd 0 = static init, NOT a runtime loop.",
        "db 'A' = 65. 'A'+1='B' (65+1=66). 'Z'+1=91 ≠ 'a'(97).",
        "EQU constant: cannot be modified, cannot take address, does not appear in output.",
      ]},
    ],
  },
  {
    number: 11, short: "Memory Layout",
    title: "Topic 11 – Memory Layout & Memory Read/Write Transactions",
    overview: "Process virtual address space: text | data | BSS | heap↑ ↓stack. Read transactions check cache hierarchy then DRAM. Write policies: write-through vs write-back.",
    sections: [
      { heading: "Virtual Address Space Segments", color: "indigo", icon: "🗺️", items: [
        "Low → High on Linux x86-64: [null] text data BSS heap↑ ... ↓stack [kernel]",
        "Text (.text): machine code. Read-only + executable. Starts ~0x400000.",
        "Data (.data): initialized global and static variables.",
        "BSS (.bss): uninitialized global/static variables. Zero-initialized by OS. No disk space in ELF.",
        "Heap: after BSS, grows UPWARD. malloc/free. Extended via brk() or mmap().",
        "Stack: starts from high address, grows DOWNWARD. Local vars, frames.",
        "Memory-mapped region (between heap and stack): shared libs, mmap'd files.",
        "Kernel space: top of address space, inaccessible from ring 3.",
      ]},
      { heading: "Memory Read/Write Transactions", color: "violet", icon: "⚡", items: [
        "Load: L1 miss → L2 miss → L3 miss → DRAM. Each level checked before next.",
        "Store write-through: write updates cache AND next level simultaneously. Simpler. Higher bandwidth.",
        "Store write-back: write only updates cache (dirty bit set). Writeback to lower on eviction.",
        "Write-allocate: on write miss, load line into cache then modify. Pairs with write-back.",
        "No-write-allocate: on write miss, write directly to next level. Pairs with write-through.",
        "Cache line = 64 bytes. Entire line fetched on miss (spatial locality).",
        "False sharing: threads write different vars in same 64B cache line → line ping-pong.",
      ]},
      { heading: "Heap & Stack Details", color: "amber", icon: "📦", items: [
        "malloc(n): allocates at least n bytes on heap. Returns pointer or NULL on failure.",
        "free(p): returns block to heap free list. Does NOT zero memory or return to OS immediately.",
        "Fragmentation: many small allocs/frees → unusable gaps in free list.",
        "Stack frame: created on each CALL, destroyed on RET (RSP restored).",
        "Stack overflow: RSP below guard page → SIGSEGV. Recursive depth limited.",
        "VMA: kernel tracks each mapped region with permissions (rwx). /proc/PID/maps shows them.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "BSS: no space in executable file. OS zero-inits. Never confuse with .data.",
        "Stack grows DOWN; heap grows UP. They can collide given enough growth.",
        "free() does not zero memory — next malloc may return same memory with old values.",
        "Write-back: DRAM has stale data until dirty line evicted. DMA engines read DRAM directly → flush first.",
        "Text segment is read-only. Writing to it → SIGSEGV.",
        "mmap(MAP_ANONYMOUS): allocates pages, zero-initialized. Pages only physically allocated on first access (page fault).",
      ]},
    ],
  },
  {
    number: 12, short: "Cache",
    title: "Topic 12 – Memory Hierarchy: Cache",
    overview: "Caches exploit locality. Organized as S sets × E ways × B bytes/line. Address = tag | set_index | block_offset. Miss types: compulsory, capacity, conflict. LRU replacement.",
    sections: [
      { heading: "Cache Organization", color: "indigo", icon: "⚡", items: [
        "Cache line = 64 bytes (typical). Unit of transfer between levels.",
        "Direct-mapped (1-way): one possible set per block. Fast but high conflict miss rate.",
        "E-way set-associative: S sets, E ways per set. Block maps to one set, any way.",
        "Fully associative: 1 set, all ways. No conflict misses. Hardware expensive.",
        "Cache capacity = S × E × B bytes.",
        "L1 data: ~32 KB, 8-way, 4-cycle. L2: ~256 KB, 8-way, ~12 cycles. L3: 8–32 MB, shared, ~40 cycles.",
      ]},
      { heading: "Address Decomposition", color: "violet", icon: "🔢", items: [
        "Address split (low to high): [block offset b bits][set index s bits][tag t bits]",
        "b = log₂(block_size). For 64B lines: b=6.",
        "s = log₂(S). For 64 sets: s=6.",
        "t = address_bits - s - b. Tag stored in cache to verify hit.",
        "Hit: valid=1 AND tag matches → return data at offset in cache line.",
        "Miss: valid=0 OR tag mismatch → fetch from next level, install in cache.",
        "Example: 32KB 8-way 64B lines → S=32768/(8×64)=64 sets. s=6, b=6, t=52 (64-bit addr).",
      ]},
      { heading: "Replacement, Policies & Locality", color: "amber", icon: "🔄", items: [
        "On miss with full set: evict one way. Policies: LRU, pseudo-LRU, random.",
        "Compulsory (cold) miss: first ever access to a block. Unavoidable.",
        "Capacity miss: working set > cache size. Would miss even with full associativity.",
        "Conflict miss: multiple blocks compete for same set. Solved by higher associativity.",
        "Write-back + write-allocate: typical L1/L2. Dirty bit per line.",
        "Temporal locality: reuse same address soon → stays in cache.",
        "Spatial locality: access nearby addresses → loaded together in cache line.",
        "Prefetching: hardware detects stride, preloads next lines automatically.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Set index bits come from MIDDLE of address (not MSBs or LSBs).",
        "Stride = cache_size/associativity → always maps to same set → thrashing.",
        "Higher associativity helps conflict misses. Does NOT help capacity misses.",
        "Write-back: dirty cache line NOT in DRAM yet. DRAM has stale data.",
        "TLB miss ≠ cache miss. TLB miss walks page table; cache miss fetches data block.",
        "Increasing block size: better spatial locality but more bandwidth per miss.",
      ]},
    ],
  },
  {
    number: 13, short: "DRAM",
    title: "Topic 13 – Memory Hierarchy: DRAM",
    overview: "DRAM cells = capacitor + transistor. Must refresh every ~64ms. Access: RAS (open row) → CAS (select column). Row buffer hit is fast. DDR transfers on both clock edges.",
    sections: [
      { heading: "DRAM Cell & Organization", color: "indigo", icon: "🔋", items: [
        "DRAM cell: 1 capacitor + 1 transistor. Charge=1, no charge=0. Leaks → must refresh.",
        "Refresh interval: ~64 ms. Refresh pauses normal access briefly.",
        "SRAM (used in caches): 6-transistor flip-flop. No refresh. Faster, larger, more expensive per bit.",
        "Organization: banks (parallel access) → rows → columns.",
        "Row buffer (sense amplifiers): entire row (~8 KB) loaded when row opened.",
        "Row buffer hit: next access to same row = fast (no new RAS needed).",
        "Row buffer miss: must precharge (close), activate new row (RAS), then CAS.",
      ]},
      { heading: "DRAM Access Timing", color: "violet", icon: "⏱️", items: [
        "RAS (Row Address Strobe): selects row, opens it into row buffer. Latency = tRCD.",
        "CAS (Column Address Strobe): selects column from open row. Latency = tCL.",
        "Precharge: closes row buffer, prepares bank for next RAS. Latency = tRP.",
        "Total first-access latency: tRCD + tCL ≈ 20–40 ns for DDR4.",
        "DRAM timing notation: 16-18-18-38 = CL-tRCD-tRP-tRAS (in clock cycles).",
        "Burst mode: after first CAS, subsequent columns return with no extra latency.",
        "Bank interleaving: access different banks while one precharges. Hides latency.",
      ]},
      { heading: "DDR & Bandwidth", color: "amber", icon: "📡", items: [
        "SDR SDRAM: 1 transfer per clock cycle.",
        "DDR: transfers on BOTH rising AND falling edges → 2× bandwidth vs SDR.",
        "DDR4-3200: 3200 MT/s (megatransfers/sec). 64-bit bus → 3200×8 = 25.6 GB/s peak.",
        "DDR5: higher speeds (4800+), on-die ECC, two 32-bit sub-channels per DIMM.",
        "Actual clock for DDR4-3200 = 1600 MHz (3200 MT/s ÷ 2).",
        "HBM: 3D stacked DRAM on package, massive bandwidth (~1 TB/s). Used in GPUs.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "DRAM requires periodic refresh. SRAM does not. Refresh causes brief unavailability.",
        "Row buffer hit is faster than miss — accessing same row multiple times is optimal.",
        "DDR4-3200: 3200 MT/s is NOT the clock frequency. Actual = 1600 MHz.",
        "DRAM is VOLATILE — data lost when power removed. Flash/SSD is non-volatile.",
        "tCL = CAS latency, column-to-data time. Lower tCL = lower latency.",
        "More DRAM ranks → more capacity but adds rank switching latency.",
      ]},
    ],
  },
  {
    number: 14, short: "HDD & SSD",
    title: "Topic 14 – Memory Hierarchy: HDD and SSD",
    overview: "HDD: spinning platters, mechanical seek (~10ms latency), high capacity, low cost. SSD: NAND flash, no moving parts, ~0.1ms read latency, limited P/E write cycles, cannot overwrite in-place.",
    sections: [
      { heading: "HDD Mechanics", color: "indigo", icon: "💿", items: [
        "Platters: spinning magnetic disks at 5400–15000 RPM.",
        "Tracks: concentric circles on platter. Sectors: fixed arcs on track (~512B or 4KB).",
        "Cylinders: same track across all platters stacked vertically.",
        "Read/write head: floats nanometers above surface on actuator arm.",
        "Seek time: move head to correct track. Avg ~3–10 ms.",
        "Rotational latency: wait for sector. Avg = ½ rotation. 7200 RPM → 60/(2×7200) ≈ 4.2 ms.",
        "Transfer time: read sector once under head (~0.05 ms for small sector).",
        "Total: seek + rotational + transfer. Dominated by seek + rotational.",
      ]},
      { heading: "SSD Technology", color: "violet", icon: "💾", items: [
        "NAND Flash: floating-gate transistors hold charge = bits.",
        "SLC (1 bit/cell): ~100k P/E cycles, fastest, most expensive.",
        "MLC (2 bits): ~10k P/E cycles. TLC (3 bits): ~3k. QLC (4 bits): ~1k cycles.",
        "Write restriction: cannot overwrite in-place. Must erase entire block (~256KB) then write pages (~4KB).",
        "Write amplification: writing 1 page may require read-modify-write of entire block.",
        "Wear leveling (FTL): distributes writes evenly across all cells to maximize lifespan.",
        "TRIM: OS informs SSD which LBAs are deleted. SSD erases proactively → faster future writes.",
        "FTL (Flash Translation Layer): maps logical → physical addresses. Transparent to OS.",
      ]},
      { heading: "Performance Comparison", color: "amber", icon: "📊", items: [
        "HDD sequential: ~100–200 MB/s. SATA SSD: ~500 MB/s. NVMe SSD: 3–7 GB/s.",
        "HDD random 4K read: ~0.1–1 MB/s (~100 IOPS). SSD: 100,000–1,000,000 IOPS.",
        "HDD latency: seek(5ms)+rotational(4ms)+transfer(0.05ms) ≈ 9ms.",
        "SSD SATA read: ~0.1ms. NVMe read: ~0.02ms.",
        "HDD cost/GB: ~$0.02. SSD: ~$0.08. HDD wins on price per byte.",
        "NVMe: uses PCIe directly, not SATA controller. Lower protocol overhead.",
        "HDD fails from shock/vibration. SSD fails from P/E exhaustion.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Rotational latency avg = 1/(2×RPM) × 60s. The ½ factor is critical (average is half rotation).",
        "SSD cannot overwrite — erase block first. Source of write amplification.",
        "TRIM: without it, SSD writes slow over time as it must erase before every write.",
        "NVMe is NOT just a fast SATA. It uses PCIe and a completely different protocol (NVMe spec).",
        "SSD wear leveling: logical address X may go to different physical cell each time written.",
        "HDD access time: seek dominates. Transfer time is relatively tiny.",
      ]},
    ],
  },
  {
    number: 15, short: "Linkers",
    title: "Topic 15 – Linkers, Symbols, Resolution & Libraries",
    overview: "Linker combines .o files into executable. Resolves symbol references. Strong/weak symbol rules determine winner. Static libs copy code; shared libs load at runtime via PLT/GOT.",
    sections: [
      { heading: "Symbols & Relocation", color: "indigo", icon: "🔗", items: [
        "Symbol: name bound to an address. Defined in one TU, referenced in others.",
        "Global (external linkage): no 'static' in C. Visible across TUs.",
        "Local (internal linkage): 'static' keyword in C. Only within TU.",
        "External reference: used but not defined in this .o. Linker must resolve.",
        "Relocation entry: records where in .o to patch once symbol address known.",
        ".symtab section: each .o has symbol table of defined + referenced symbols.",
      ]},
      { heading: "Symbol Resolution Rules", color: "violet", icon: "⚖️", items: [
        "Strong symbol: defined function OR initialized global variable.",
        "Weak symbol: uninitialized global variable (or __attribute__((weak))).",
        "Rule 1: Two strong symbols with same name → LINKER ERROR.",
        "Rule 2: One strong + one or more weak → strong wins silently.",
        "Rule 3: Multiple weak symbols → linker picks one arbitrarily.",
        "Undefined symbol → linker error unless weak.",
        "Linker scans left to right. Order matters: -llib must come AFTER the .o that uses it.",
      ]},
      { heading: "Static vs Dynamic Libraries", color: "amber", icon: "📚", items: [
        "Static lib (.a): archive of .o files. Linker copies only needed .o into executable.",
        "Result: self-contained, no runtime dependency, larger binary.",
        "Dynamic lib (.so Linux / .dll Windows): separate file, loaded at runtime by dynamic linker.",
        "PLT (Procedure Linkage Table): stub for each imported function. First call: dynamic linker resolves.",
        "GOT (Global Offset Table): holds resolved runtime addresses. PLT stubs indirect through GOT.",
        "PIC (Position-Independent Code): -fPIC. Required for .so. Uses RIP-relative addresses.",
        "LD_LIBRARY_PATH: runtime search path for .so files. ldd executable: shows dependencies.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Static lib: only .o files that satisfy undefined symbols are linked. Unused code excluded.",
        "int x; in two .h files both #included → two weak symbols → one silently wins. Silent bug.",
        "Dynamic lib missing at runtime → 'cannot open shared object file' even if link succeeded.",
        "-L flag: link-time search path. LD_LIBRARY_PATH: runtime search path. DIFFERENT.",
        "PIC required for .so — absolute addresses break when loaded at different address each run.",
        "Linker left-to-right: libA.a before main.o → main.o's undefined symbols unresolved.",
      ]},
    ],
  },
  {
    number: 16, short: "Exceptions",
    title: "Topic 16 – Asynchronous & Synchronous Exceptions",
    overview: "Exceptions transfer control to kernel. Synchronous: caused by current instruction (trap/fault/abort). Asynchronous (interrupts): from hardware, unrelated to current instruction.",
    sections: [
      { heading: "Exception Mechanism", color: "indigo", icon: "⚡", items: [
        "Exception: event causing CPU to transfer control to OS kernel handler.",
        "Exception table: 256 entries (x86), each holds handler address. Indexed by exception number.",
        "On exception: save registers + PC + privilege level → switch to ring 0 → run handler.",
        "x86 exception numbers: 0=#DE(divide), 13=#GP(general protection), 14=#PF(page fault).",
        "Syscall: INT 0x80 (32-bit) or SYSCALL instruction (64-bit). Intentional trap.",
        "Exception vs interrupt: exceptions synchronous (from instruction); interrupts asynchronous.",
      ]},
      { heading: "Synchronous Exception Types", color: "violet", icon: "🔄", items: [
        "TRAP: intentional. Returns to NEXT instruction. Examples: syscall (INT 80h), breakpoint (INT 3).",
        "FAULT: potentially recoverable. Returns to SAME instruction (retries). Examples: page fault, #GP.",
        "ABORT: unrecoverable. Process terminated. Examples: machine check, double fault.",
        "Divide-by-zero (#DE): sends SIGFPE to process → terminates by default.",
        "Page fault (#PF): fault → OS loads page → CPU retries faulting instruction.",
        "INT 3 (breakpoint): single byte 0xCC. Debugger inserts to pause execution.",
      ]},
      { heading: "Asynchronous Exceptions (Interrupts)", color: "amber", icon: "🔔", items: [
        "Caused by external hardware, independent of currently-executing instruction.",
        "Timer interrupt: CPU preemption for multitasking. OS scheduler runs.",
        "I/O interrupt: disk/NIC signals completion. Kernel wakes sleeping process.",
        "Maskable interrupts: disabled with CLI (EFLAGS.IF=0). Re-enabled with STI.",
        "Non-maskable interrupt (NMI): cannot be disabled. Used for hardware errors.",
        "After handling: returns to instruction that was interrupted. Transparent to program.",
        "APIC (Advanced Programmable Interrupt Controller): manages IRQs on x86.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Trap → NEXT instruction. Fault → SAME instruction (retry). Abort → no return.",
        "Page fault is a FAULT — OS loads page, CPU re-executes the SAME load/store.",
        "SYSCALL is a trap — program continues from instruction AFTER syscall on return.",
        "Interrupts are asynchronous — can arrive between any two instructions.",
        "Kernel mode switch: privilege 3→0, stack switches to kernel stack on exception.",
        "Divide-by-zero is classified as fault on x86 but program receives SIGFPE and dies.",
      ]},
    ],
  },
  {
    number: 17, short: "Processes & Threads",
    title: "Topic 17 – Processes, Threads, Race Conditions & Background Jobs",
    overview: "Process = isolated address space + PID + file descriptors. fork() creates child. exec() replaces image. Threads share address space. Race condition: outcome depends on scheduling order.",
    sections: [
      { heading: "Process Model", color: "indigo", icon: "🖥️", items: [
        "Process: virtual address space, registers, open FDs, PID, PPID, signal handlers.",
        "States: running (on CPU), ready (waiting for CPU), blocked (waiting for event/I/O).",
        "Context switch: save current process state, restore next. Triggered by timer or blocking syscall.",
        "fork(): creates child = copy of parent (copy-on-write). Returns child PID to parent, 0 to child.",
        "exec(path,argv,envp): replaces process image with new program. On success, never returns.",
        "wait(&status): parent waits for any child to exit. Returns child PID.",
        "waitpid(pid,&status,opts): wait for specific child. WNOHANG = non-blocking.",
        "exit(code): sends SIGCHLD to parent. Becomes zombie until parent calls wait().",
      ]},
      { heading: "Threads", color: "violet", icon: "🧵", items: [
        "Thread: lightweight execution unit. Shares: address space, heap, globals, FDs, signal handlers.",
        "Thread-private: stack, registers, PC, errno, TLS.",
        "pthread_create(&tid, NULL, func, arg): spawn. pthread_join(tid, &ret): wait.",
        "pthread_exit(ret): exit current thread. pthread_self(): get TID.",
        "pthread_detach(tid): thread auto-cleanup on exit (no join needed).",
        "Threads: faster create/switch than processes (no address space copy).",
        "Shared memory = easy IPC but requires synchronization to avoid races.",
      ]},
      { heading: "Race Conditions & Background Jobs", color: "amber", icon: "🏁", items: [
        "Race condition: two threads access shared data, at least one writes, no synchronization.",
        "Result depends on scheduling → non-deterministic bug. Hard to reproduce.",
        "Critical section: code that must not run concurrently on shared data.",
        "Background job: shell cmd & — shell doesn't wait. Job ID and PID printed.",
        "Zombie: child exited, parent not called wait(). Stays in process table. No CPU but wastes slot.",
        "Orphan: parent exits first. Init (PID 1) adopts orphan. Init calls wait() periodically.",
        "SIGCHLD: sent to parent when child stops or terminates.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "After fork(): BOTH parent AND child continue from the instruction AFTER fork().",
        "fork() returns: >0 (child PID) to parent, 0 to child, -1 on error.",
        "exec() replaces everything — code, data, heap, stack. FDs survive unless FD_CLOEXEC set.",
        "Zombie: exists until parent calls wait(). Fills process table slot. Not a running process.",
        "Thread stacks are separate even though address space is shared.",
        "'It works usually' is NOT proof there is no race. Races are timing-dependent.",
      ]},
    ],
  },
  {
    number: 18, short: "Signals",
    title: "Topic 18 – Signals, Signal Handlers & Nonlocal Jumps",
    overview: "Signal = software interrupt to process. SIGKILL(9) and SIGSTOP(19) cannot be caught. Handlers run asynchronously. Only async-signal-safe functions allowed in handlers. setjmp/longjmp = nonlocal goto.",
    sections: [
      { heading: "Signal Basics", color: "indigo", icon: "📡", items: [
        "Signal: asynchronous notification delivered to process. Each has a number.",
        "SIGINT(2): Ctrl+C. SIGTERM(15): polite kill. SIGKILL(9): force kill — UNCATCHABLE.",
        "SIGSEGV(11): segfault. SIGFPE(8): arithmetic error. SIGCHLD(17): child stopped/exited.",
        "SIGSTOP(19): stop process — UNCATCHABLE. SIGCONT(18): resume. SIGALRM(14): timer.",
        "Pending signal: sent but not yet delivered (e.g. currently blocked).",
        "Only 1 pending signal per type (not queued). Additional same-type signals dropped.",
        "Blocked signal: in signal mask. Delivered when unblocked. sigprocmask() modifies mask.",
      ]},
      { heading: "Signal Handlers", color: "violet", icon: "🎯", items: [
        "signal(SIGNUM, handler): register handler. SIG_DFL=default, SIG_IGN=ignore.",
        "sigaction(SIGNUM, &act, &oldact): POSIX standard. Better control. Preferred.",
        "SA_RESTART flag: auto-restart interrupted syscalls after handler returns.",
        "Handler runs in same thread, asynchronously interrupting normal execution.",
        "Async-signal-safe functions ONLY in handlers: write(), read(), _exit(), kill(), sigprocmask().",
        "printf(), malloc(), free() are NOT safe in handlers (use non-reentrant globals).",
        "volatile sig_atomic_t flag: safe to set in handler, read in main loop.",
      ]},
      { heading: "Nonlocal Jumps", color: "amber", icon: "🔀", items: [
        "setjmp(jmp_buf env): saves execution state (regs, SP, PC). Returns 0.",
        "longjmp(env, val): restores saved state. setjmp appears to return val (never 0).",
        "Use: error recovery across call stack without propagating error returns.",
        "sigsetjmp/siglongjmp: like setjmp/longjmp but also save/restore signal mask.",
        "Danger: longjmp skips all cleanup code between setjmp and longjmp site (destructors, frees).",
        "sig_atomic_t: type guaranteed to be read/written atomically w.r.t. signal delivery.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "SIGKILL(9) and SIGSTOP(19) cannot be caught, blocked, or ignored. Period.",
        "Signals NOT queued: 5 SIGINTs while SIGINT blocked → only 1 delivered on unblock.",
        "printf() in signal handler = unsafe (uses global buffer, not reentrant). Use write().",
        "longjmp (not siglongjmp) from signal handler leaves signal mask as set by handler.",
        "signal() vs sigaction(): signal() behavior varies by implementation. Use sigaction().",
        "After fork(): child inherits handlers and mask. After exec(): handlers reset to SIG_DFL.",
      ]},
    ],
  },
  {
    number: 19, short: "I/O",
    title: "Topic 19 – Input/Output & Standard I/O",
    overview: "Unix I/O: integer file descriptors, syscalls (open/read/write/close) — unbuffered. stdio: FILE* with buffering. Stdout is line-buffered to terminal, fully-buffered to file. Everything is a file.",
    sections: [
      { heading: "Unix I/O (Syscall Level)", color: "indigo", icon: "📁", items: [
        "File descriptor: non-negative integer. 0=stdin, 1=stdout, 2=stderr.",
        "open(path, flags, mode): returns new FD. O_RDONLY, O_WRONLY, O_RDWR, O_CREAT, O_TRUNC.",
        "read(fd, buf, n): up to n bytes → returns bytes read. 0=EOF. -1=error.",
        "write(fd, buf, n): write n bytes → returns bytes written (may be less). -1=error.",
        "close(fd): release FD. lseek(fd, offset, whence): reposition (SEEK_SET/CUR/END).",
        "stat(path, &sb): metadata (size, type, permissions, timestamps).",
        "FDs inherited by fork(). Survive exec() unless FD_CLOEXEC set.",
      ]},
      { heading: "Standard I/O (stdio)", color: "violet", icon: "📜", items: [
        "FILE*: opaque handle wrapping FD with user-space buffer.",
        "Fully buffered: data held until buffer full or fflush(). Default for regular files.",
        "Line buffered: flushed on newline or full buffer. Default stdout to terminal.",
        "Unbuffered: no buffer. Default stderr.",
        "fopen/fread/fwrite/fclose. fprintf/printf/scanf/fscanf.",
        "fflush(fp): force write buffer to kernel. fflush(NULL): flush all output streams.",
        "fgets(buf, n, fp): reads up to n-1 chars + null. Includes newline if present.",
        "setvbuf(fp, buf, mode, size): set buffer mode (_IOFBF/_IOLBF/_IONBF).",
      ]},
      { heading: "Pipes & Redirection", color: "amber", icon: "🔧", items: [
        "dup2(oldfd, newfd): newfd now refers to same file as oldfd. Closes newfd first.",
        "Shell cmd > file: opens file, dup2 to fd 1 (stdout).",
        "pipe(fds[2]): fds[0]=read end, fds[1]=write end. Kernel buffer ~64KB.",
        "Pipe between processes: fork after pipe(). Parent→fds[1], child→fds[0]. Close unused ends!",
        "EOF from pipe: all write ends closed → reader gets EOF (read returns 0).",
        "select()/poll()/epoll(): monitor multiple FDs. epoll O(1) per event. select O(n) up to 1024.",
        "FIFO (named pipe): mkfifo(). Persists in filesystem. Cross-process without fork.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "printf() buffered — output may not appear immediately. Use fflush(stdout) or newline.",
        "read() may return LESS than n bytes (partial read). Always loop to read full amount.",
        "If parent forgets to close write end of pipe after fork, child never sees EOF.",
        "stdout line-buffered to terminal, fully-buffered when redirected. printf behavior differs.",
        "fgets includes the '\\n'. Strip it with: buf[strcspn(buf,\"\\n\")]=0.",
        "FDs are integers — NOT FILE*. Mixing write()/fprintf() on same FD can corrupt output.",
      ]},
    ],
  },
  {
    number: 20, short: "Virtual Memory",
    title: "Topic 20 – Virtual Memory & Address Translation",
    overview: "Each process has private virtual address space. CPU translates VA→PA via page tables (4-level on x86-64). TLB caches recent translations. Page fault: P-bit=0 → OS handler loads page from disk.",
    sections: [
      { heading: "Pages & Page Tables", color: "indigo", icon: "📄", items: [
        "Page = 4KB (12-bit offset). Physical memory split into same-size frames.",
        "Page table: array indexed by VPN (virtual page number). Entry = PTE.",
        "PTE fields: present bit(P), physical frame number(PFN), dirty, accessed, R/W/X/U bits.",
        "If P=0: page not in RAM → page fault on access.",
        "x86-64: 4-level. CR3 = physical addr of PML4 table.",
        "4 levels: PML4[9] → PDPT[9] → PD[9] → PT[9] + offset[12] = 48-bit virtual address.",
        "Each level is a 4KB page with 512 × 8-byte PTEs.",
      ]},
      { heading: "TLB & Address Translation", color: "violet", icon: "⚡", items: [
        "TLB: small hardware cache of VPN→PFN translations. 32–1024 entries typical.",
        "TLB hit: 1 cycle to get PA. TLB miss: 4 memory accesses (one per page table level).",
        "Translation: VA → VPN+VPO → TLB lookup → PFN → PA = PFN:VPO.",
        "VPO (virtual page offset) = low 12 bits. Passes through unchanged to PA.",
        "ASID (Address Space ID): tag TLB entries per process. Avoids full flush on context switch.",
        "INVLPG addr: invalidate single TLB entry. CR3 write: flush all TLB.",
        "Page fault handler: allocate frame, load page from disk, set PTE, return. CPU retries.",
      ]},
      { heading: "Protection & Demand Paging", color: "amber", icon: "🛡️", items: [
        "Per-page protection bits: R(read), W(write), X(execute), U(user/supervisor).",
        "Write to read-only page → #PF with write bit → OS sends SIGSEGV.",
        "Demand paging: pages loaded only on first access (page fault). Reduces startup time.",
        "Copy-on-write (COW): fork() shares pages marked read-only. First write → fault → copy page.",
        "Swap: evicted pages go to disk swap space. Page daemon selects LRU pages when RAM low.",
        "Huge pages: 2MB or 1GB. Fewer TLB entries for same memory. Less TLB pressure.",
        "mmap(NULL,len,prot,MAP_ANON|MAP_PRIVATE,-1,0): allocate anonymous zero pages.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "TLB miss ≠ page fault. TLB miss → hardware page table walk. Page fault → P=0 → OS handler.",
        "VPO bits = log₂(page_size). 4KB page → 12 bits. Unchanged from VA to PA.",
        "COW write fault: page IS present (P=1) but read-only → write fault → OS copies page.",
        "4-level table walk = 4 DRAM accesses without TLB. TLB critical for performance.",
        "Physical address space can be SMALLER than virtual. Many VAs map nowhere.",
        "After exec(), page table replaced. Old mappings gone. Stack/heap re-initialized.",
      ]},
    ],
  },
  {
    number: 21, short: "Concurrent Programming",
    title: "Topic 21 – Concurrent Programming",
    overview: "Concurrent = multiple flows overlapping in time (not necessarily parallel). Three models: processes, threads, I/O multiplexing. Thread safety and reentrancy are distinct. Deadlock requires 4 conditions.",
    sections: [
      { heading: "Concurrency Models", color: "indigo", icon: "🔀", items: [
        "Concurrency: multiple tasks in progress at overlapping times. Can happen on 1 core (interleaving).",
        "Parallelism: multiple tasks executing at the SAME instant. Requires multiple cores.",
        "Process-based: fork() per client. Strong isolation. IPC overhead (pipes/sockets).",
        "Thread-based: shared memory, easy communication, synchronization required.",
        "I/O multiplexing: single process, event loop, select()/poll()/epoll(). No sync needed. Complex code.",
        "epoll (Linux): O(1) per ready event. Scales to millions of FDs. select() limited to 1024 FDs.",
      ]},
      { heading: "Pthreads API", color: "violet", icon: "🧵", items: [
        "pthread_create(&tid, attr, func, arg): spawn thread. NULL attr = defaults.",
        "pthread_join(tid, &retval): wait for thread exit. Gets return value.",
        "pthread_detach(tid): auto-release resources on exit. No join needed/possible.",
        "pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;",
        "pthread_mutex_lock(&m): blocks if locked. pthread_mutex_unlock(&m): releases.",
        "pthread_mutex_trylock(&m): non-blocking. Returns EBUSY if already locked.",
        "__thread int x: thread-local storage (GCC). Each thread has own copy.",
      ]},
      { heading: "Thread Safety & Reentrancy", color: "amber", icon: "✅", items: [
        "Thread-safe: correct results when called concurrently. Achieved with locking.",
        "Non-thread-safe: uses global/static state without sync. Examples: rand(), strtok(), localtime().",
        "Reentrant: thread-safe WITHOUT synchronization. Only uses local vars + args. No shared state.",
        "Reentrant ⊂ thread-safe. Thread-safe does NOT imply reentrant.",
        "Use _r variants for thread safety: strtok_r(), localtime_r(), rand_r().",
        "Deadlock: A holds lock1 waits lock2. B holds lock2 waits lock1. Circular wait.",
        "Prevention: always acquire locks in same global order.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "Concurrent ≠ parallel. Single-core can be concurrent (interleaved), not parallel.",
        "Reentrant ⊂ thread-safe. NOT equivalent. Mutex = thread-safe, NOT reentrant.",
        "pthread_join required unless thread is detached. Otherwise zombie threads accumulate.",
        "Mutex doesn't prevent deadlock — wrong LOCK ORDER causes deadlock.",
        "errno in glibc is thread-local (implementation detail). Don't assume this everywhere.",
        "select() FD_SETSIZE=1024. epoll has no such limit. Use epoll for high concurrency.",
      ]},
    ],
  },
  {
    number: 22, short: "Parallelism & Sync",
    title: "Topic 22 – Parallelism & Synchronization",
    overview: "Mutex = binary lock for critical sections. Semaphore = counter. Condition variable = wait for condition (always use while, not if). Amdahl's Law: serial fraction limits max speedup.",
    sections: [
      { heading: "Mutex & Semaphore", color: "indigo", icon: "🔒", items: [
        "Mutex: ensures only 1 thread in critical section. pthread_mutex_lock/unlock.",
        "Semaphore: integer counter. sem_wait(s): s-- (blocks if s=0). sem_post(s): s++.",
        "Binary semaphore (init=1): equivalent to mutex.",
        "Counting semaphore: limit concurrent access. E.g. max 5 threads in DB connection pool.",
        "sem_init(&s, pshared, value). sem_destroy(&s).",
        "Spinlock: busy-wait. pthread_spinlock_t. Good for short sections on multicore. Bad on uniprocessor.",
        "sem_post() is async-signal-safe. pthread_mutex_unlock() is NOT.",
      ]},
      { heading: "Condition Variables", color: "violet", icon: "⏳", items: [
        "pthread_cond_t: thread waits until a condition is true.",
        "pthread_cond_wait(&cond, &mutex): atomically releases mutex + sleeps. On wake: reacquires mutex.",
        "pthread_cond_signal(&cond): wake one waiter. pthread_cond_broadcast: wake all.",
        "ALWAYS use while, not if: while(!condition) { pthread_cond_wait(&cond,&mutex); }",
        "Why while: spurious wakeups (OS may wake thread without signal). Must re-check condition.",
        "Must hold mutex before calling cond_wait. Mutex auto-released during sleep.",
        "Reader-writer lock: pthread_rwlock_t. Multiple readers OR single writer.",
      ]},
      { heading: "Deadlock & Amdahl's Law", color: "amber", icon: "📊", items: [
        "Deadlock: 4 conditions all required: (1)mutual exclusion (2)hold-and-wait (3)no preemption (4)circular wait.",
        "Prevention: break any one. Easiest: enforce global lock ordering (breaks circular wait).",
        "Amdahl's Law: S(N) = 1 / (f + (1-f)/N). f=serial fraction, N=processors.",
        "10% serial (f=0.1): max speedup = 10×. 50% serial: max = 2×. No matter how many cores.",
        "Data parallelism: same op on different data (SIMD, loop parallelism).",
        "Task parallelism: different tasks on different threads.",
        "False sharing: threads write different vars in same 64B cache line → line bounces between cores.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "ALWAYS while() not if() with pthread_cond_wait. Spurious wakeups are real.",
        "pthread_cond_wait must be called with mutex LOCKED. Releases atomically during sleep.",
        "Amdahl with 8 cores, 20% serial: S = 1/(0.2 + 0.8/8) = 1/0.3 = 3.33×",
        "Deadlock: holding one lock while waiting for another. Solution: always acquire in same order.",
        "Spinlock on uniprocessor: spinning thread prevents lock holder from running → indefinite wait.",
        "sem_post from signal handler is OK. mutex_unlock from signal handler is NOT (async-signal-unsafe).",
      ]},
    ],
  },
  {
    number: 23, short: "Virtual Machines",
    title: "Topic 23 – Virtual Machines",
    overview: "VM = software emulation of hardware. Hypervisor type 1 runs on bare metal (fast, data center). Type 2 runs on host OS (easy setup, dev/test). Intel VT-x / AMD-V enable hardware-assisted virtualization.",
    sections: [
      { heading: "VM Concepts & Hypervisor Types", color: "indigo", icon: "🖥️", items: [
        "Virtual Machine: complete emulated computer. Guest OS runs unaware of virtualization.",
        "Hypervisor (VMM): software that creates, manages, and isolates VMs.",
        "Type 1 (bare-metal): hypervisor runs DIRECTLY on hardware. No host OS.",
        "Type 1 examples: VMware ESXi, Microsoft Hyper-V, KVM (Linux kernel = hypervisor).",
        "Type 2 (hosted): hypervisor runs as app on host OS. Higher overhead.",
        "Type 2 examples: VirtualBox, VMware Workstation, Parallels.",
        "Type 1: lower overhead, better performance, used in production/data centers.",
        "Type 2: easier to install, good for desktop/development use.",
      ]},
      { heading: "Virtualization Techniques", color: "violet", icon: "⚙️", items: [
        "Full virtualization: guest OS unmodified. Hypervisor emulates all hardware.",
        "Trap-and-emulate: privileged guest instructions trap to hypervisor for emulation.",
        "Binary translation (VMware pre-VT-x): rewrites privileged instruction blocks on the fly.",
        "Paravirtualization: guest OS modified to use hypercalls. Xen PV mode. Faster but needs OS port.",
        "Hardware-assisted: CPU has dedicated VM support. Intel VT-x (vmx), AMD-V (svm).",
        "VMCS (VM Control Structure): per-VM data structure. VMLAUNCH/VMRESUME enter guest.",
        "VM exit: guest executes privileged/sensitive instruction → hardware saves state → hypervisor handles.",
        "VM exit expensive: hundreds to thousands of cycles each.",
      ]},
      { heading: "Memory & I/O Virtualization", color: "amber", icon: "🗺️", items: [
        "Guest thinks it has physical memory 0..N. Hypervisor maps guest-physical → host-physical.",
        "Two page table levels: guest VA→guest PA (guest PT) + guest PA→host PA (EPT/NPT).",
        "EPT (Intel Extended Page Tables) / NPT (AMD Nested Page Tables): hardware handles both levels.",
        "Shadow page tables (pre-EPT): hypervisor manually maintains VA→host-PA. Expensive.",
        "I/O: emulated devices (slow), virtio paravirtual drivers (fast), passthrough/SR-IOV (near-native).",
        "SR-IOV: physical NIC presents multiple virtual functions. Each VM gets dedicated VF.",
        "Snapshots: save VM state (memory+disk). Instant rollback. Not a substitute for backup.",
        "Live migration: transfer running VM between physical hosts. Near-zero downtime.",
      ]},
      { heading: "Exam Traps", color: "red", icon: "⚠️", items: [
        "KVM = type 1. Linux kernel acts as hypervisor. NOT type 2 even though it requires Linux.",
        "VirtualBox/VMware Workstation = type 2. VMware ESXi = type 1.",
        "Full virtualization: guest NOT modified. Paravirtualization: guest IS modified.",
        "VM exit is expensive. Minimize exits for performance (batch I/O, avoid frequent privileged ops).",
        "EPT/NPT: hardware walks TWO levels of page tables. TLB miss more expensive in VM than native.",
        "Snapshot ≠ backup. Deleting the base disk breaks all snapshots on top of it.",
      ]},
    ],
  },
];

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function StudyPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const topic = TOPICS[selected];

  function selectTopic(i: number) {
    setSelected(i);
    setOpenSections({});
    scrollToTop();
  }

  function toggleSection(key: string) {
    setOpenSections(prev => {
      const current = prev[key] ?? true;
      return { ...prev, [key]: !current };
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 bg-slate-950 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <span className="font-semibold text-sm text-slate-200">CS231 Study Guide</span>
        <span className="text-slate-600 hidden sm:inline">·</span>
        <span className="text-slate-500 text-xs hidden sm:inline">23 Topics · Spring 2026</span>
      </header>

      <div className="border-b border-slate-800 bg-slate-900/40 sticky top-[53px] z-10">
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3 gap-3">
            <span className="text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2.5 py-1 rounded-full flex-shrink-0">
              Topic {topic.number} / 23
            </span>
            <div className="flex items-center gap-3 ml-auto">
              {selected > 0 && (
                <button onClick={() => selectTopic(selected - 1)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Prev</button>
              )}
              {selected < TOPICS.length - 1 && (
                <button onClick={() => selectTopic(selected + 1)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Next →</button>
              )}
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{topic.title}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{topic.overview}</p>
        </div>

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

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/exam")}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
          >
            <Star className="w-4 h-4" /> Test Yourself
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
