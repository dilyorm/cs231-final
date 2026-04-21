"""Run this once to seed all 95 questions into the database."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import database as db

QUESTIONS = [
    # ── TOPIC 1 ──────────────────────────────────────────────────────────────
    {"id":"T01-1","topic_number":1,"topic":"Topic 1 – Binary Representation & Byte Ordering",
     "question":"Explain what 'byte-oriented memory organization' means. How does a CPU address individual bytes?",
     "followups":["What is the difference between big-endian and little-endian?",
                  "Give a concrete example: store 0x12345678 at address 0x100 in little-endian. What is at address 0x100?",
                  "Why does endianness matter when sending data over a network?",
                  "On x86, is memory big-endian or little-endian?"],
     "code_challenge":None},

    {"id":"T01-2","topic_number":1,"topic":"Topic 1 – Binary Representation & Byte Ordering",
     "question":"Convert the decimal number 237 to binary. Then show its hex representation.",
     "followups":["How many bits do you need to represent 237?",
                  "What is the value of bit 7 in 237?",
                  "Convert 0xAF to decimal without a calculator.",
                  "What is 237 in octal?"],
     "code_challenge":None},

    {"id":"T01-3","topic_number":1,"topic":"Topic 1 – Binary Representation & Byte Ordering",
     "question":"What is a word size and why does it matter for a processor architecture?",
     "followups":["How does word size affect the maximum addressable memory?",
                  "What is the word size of a modern x86-64 processor?",
                  "If word size is 32 bits, what is the maximum RAM the CPU can directly address?",
                  "What changed from 32-bit to 64-bit architecture in terms of memory addressing?"],
     "code_challenge":None},

    {"id":"T01-4","topic_number":1,"topic":"Topic 1 – Binary Representation & Byte Ordering",
     "question":"Explain the difference between a bit, a nibble, a byte, and a word.",
     "followups":["How many nibbles in a 32-bit integer?","What is a QWORD?","Why is hex notation convenient for binary data?"],
     "code_challenge":None},

    {"id":"T01-5","topic_number":1,"topic":"Topic 1 – Binary Representation & Byte Ordering",
     "question":"How do you determine if a system is big-endian or little-endian programmatically in C?",
     "followups":["What does the network byte order mean and which endianness is it?",
                  "Why do x86 CPUs use little-endian?"],
     "code_challenge":"Write a C snippet that detects endianness at runtime using a union or pointer cast."},

    # ── TOPIC 2 ──────────────────────────────────────────────────────────────
    {"id":"T02-1","topic_number":2,"topic":"Topic 2 – Encoding Integers & Arithmetic",
     "question":"Explain two's complement representation. How do you negate a number in two's complement?",
     "followups":["What is the range of a signed 8-bit two's complement integer?",
                  "Why is there one more negative value than positive in two's complement?",
                  "What is the two's complement of 0? Why?",
                  "How does the CPU detect overflow in signed addition?"],
     "code_challenge":"Convert -57 to 8-bit two's complement binary. Show each step."},

    {"id":"T02-2","topic_number":2,"topic":"Topic 2 – Encoding Integers & Arithmetic",
     "question":"What is the difference between unsigned and signed integer overflow? Give an example of each.",
     "followups":["What happens in C when you cast a negative signed int to unsigned?",
                  "What is the result of 255 + 1 in an unsigned 8-bit register?",
                  "How does the CPU use the carry flag vs. overflow flag differently?"],
     "code_challenge":None},

    {"id":"T02-3","topic_number":2,"topic":"Topic 2 – Encoding Integers & Arithmetic",
     "question":"Explain sign extension. Why is it needed and how does it work?",
     "followups":["What is the sign-extended version of 0b10110011 (8-bit) in 16-bit?",
                  "What is zero extension and when is it used instead?",
                  "In x86-64, what happens when you write to a 32-bit register like EAX?"],
     "code_challenge":None},

    {"id":"T02-4","topic_number":2,"topic":"Topic 2 – Encoding Integers & Arithmetic",
     "question":"How does integer multiplication work differently from addition at the hardware level? What about division?",
     "followups":["In x86, which registers are implicitly used by MUL and DIV?",
                  "What is the difference between IMUL and MUL?",
                  "What exception occurs if you divide by zero?",
                  "How can you use bit shifts to multiply/divide by powers of 2?"],
     "code_challenge":"Write NASM code to multiply rax by 10 without using the MUL instruction."},

    {"id":"T02-5","topic_number":2,"topic":"Topic 2 – Encoding Integers & Arithmetic",
     "question":"What is the difference between arithmetic right shift and logical right shift?",
     "followups":["Which shift preserves the sign bit?",
                  "What is -8 >> 1 using arithmetic shift on a signed 8-bit value?",
                  "In C, what does >> do for signed vs unsigned types?"],
     "code_challenge":None},

    # ── TOPIC 3 ──────────────────────────────────────────────────────────────
    {"id":"T03-1","topic_number":3,"topic":"Topic 3 – Encoding Fractional Numbers (Float/Double)",
     "question":"Describe the IEEE 754 single-precision float format. What are its three fields?",
     "followups":["How many bits for sign, exponent, mantissa in float32?",
                  "What is the bias in single-precision exponent and why is it used?",
                  "What is the value of the special exponent 0xFF in float32?",
                  "Represent -6.5 in IEEE 754 single precision."],
     "code_challenge":None},

    {"id":"T03-2","topic_number":3,"topic":"Topic 3 – Encoding Fractional Numbers (Float/Double)",
     "question":"Explain the difference between float and double in terms of precision and range.",
     "followups":["Why can't 0.1 be represented exactly in binary floating point?",
                  "What does 'machine epsilon' mean?",
                  "What is the precision (significant decimal digits) of float vs double?"],
     "code_challenge":None},

    {"id":"T03-3","topic_number":3,"topic":"Topic 3 – Encoding Fractional Numbers (Float/Double)",
     "question":"Explain the four rounding modes defined in IEEE 754.",
     "followups":["Which rounding mode is the default (round to nearest even)?",
                  "Why is 'round half to even' preferred over round half up?",
                  "What rounding mode does truncation correspond to?"],
     "code_challenge":None},

    {"id":"T03-4","topic_number":3,"topic":"Topic 3 – Encoding Fractional Numbers (Float/Double)",
     "question":"What are denormalized (subnormal) numbers in IEEE 754? Why do they exist?",
     "followups":["How do you identify a subnormal float from its bit pattern?",
                  "What is the smallest positive normal float32?",
                  "What is the value of a float with all bits zero except the mantissa?"],
     "code_challenge":None},

    {"id":"T03-5","topic_number":3,"topic":"Topic 3 – Encoding Fractional Numbers (Float/Double)",
     "question":"How is floating-point addition performed? Walk through: 1.5 + 0.375.",
     "followups":["Why must you align exponents before adding mantissas?",
                  "What is catastrophic cancellation?",
                  "Is floating-point addition associative? Prove or disprove with an example."],
     "code_challenge":None},

    # ── TOPIC 4 ──────────────────────────────────────────────────────────────
    {"id":"T04-1","topic_number":4,"topic":"Topic 4 – x86/x64 Processors & Registers",
     "question":"Name the general-purpose 64-bit registers in x86-64. What are the 32/16/8-bit sub-register names for RAX?",
     "followups":["What is the difference between writing to EAX vs RAX?",
                  "Which registers are caller-saved vs callee-saved in System V AMD64 ABI?",
                  "Which registers hold function arguments in Linux x86-64 calling convention?"],
     "code_challenge":None},

    {"id":"T04-2","topic_number":4,"topic":"Topic 4 – x86/x64 Processors & Registers",
     "question":"What is the RFLAGS register? Name five important flags and when they are set.",
     "followups":["What is the Zero Flag (ZF) used for in conditional jumps?",
                  "How does the Carry Flag (CF) differ from the Overflow Flag (OF)?",
                  "What instruction sets ZF without changing any register?"],
     "code_challenge":None},

    {"id":"T04-3","topic_number":4,"topic":"Topic 4 – x86/x64 Processors & Registers",
     "question":"What is the instruction pointer (RIP) and can software write to it directly?",
     "followups":["How does RIP-relative addressing work?",
                  "What instruction modifies RIP implicitly?",
                  "How does a function call modify RIP and RSP?"],
     "code_challenge":None},

    {"id":"T04-4","topic_number":4,"topic":"Topic 4 – x86/x64 Processors & Registers",
     "question":"What were the major changes from 32-bit (IA-32) to 64-bit (x86-64) architecture?",
     "followups":["How many general-purpose registers does x86-64 add compared to IA-32?",
                  "What is the REX prefix in x86-64 encoding?",
                  "Why is the address space not full 64-bit (only 48-bit canonical addresses)?"],
     "code_challenge":None},

    {"id":"T04-5","topic_number":4,"topic":"Topic 4 – x86/x64 Processors & Registers",
     "question":"Compare AMD64 and Intel EM64T (Intel 64). Are they compatible? What differences exist?",
     "followups":["Who developed x86-64 first — Intel or AMD?",
                  "What is the significance of AMD's contribution to the 64-bit PC standard?"],
     "code_challenge":None},

    # ── TOPIC 5 ──────────────────────────────────────────────────────────────
    {"id":"T05-1","topic_number":5,"topic":"Topic 5 – Assembly Language & Arithmetic",
     "question":"What is the difference between high-level language and assembly? What does an assembler do?",
     "followups":["What is the difference between an assembler and a compiler?",
                  "What is machine code versus assembly?",
                  "Name two popular x86 assemblers and how their syntax differs (AT&T vs Intel)."],
     "code_challenge":None},

    {"id":"T05-2","topic_number":5,"topic":"Topic 5 – Assembly Language & Arithmetic",
     "question":"Explain ADD, SUB, INC, DEC, NEG instructions. How do they affect flags?",
     "followups":["What is the difference between SUB rax, rbx and NEG rax?",
                  "Does INC set the Carry Flag? What about ADD?",
                  "How do you add two 128-bit numbers stored in register pairs?"],
     "code_challenge":"Write NASM code to compute (a + b - c) where a=10, b=20, c=5, result in rax."},

    {"id":"T05-3","topic_number":5,"topic":"Topic 5 – Assembly Language & Arithmetic",
     "question":"Explain AND, OR, XOR, NOT instructions. Give a practical use for each.",
     "followups":["How do you clear the lower 4 bits of rax using AND?",
                  "How do you toggle a specific bit using XOR?",
                  "What does XOR rax, rax do and why is it common?"],
     "code_challenge":"Write NASM to isolate bits 4-7 (the second nibble) of the al register."},

    {"id":"T05-4","topic_number":5,"topic":"Topic 5 – Assembly Language & Arithmetic",
     "question":"What is the CMP instruction and how does it work? How is it used with conditional jumps?",
     "followups":["What arithmetic operation does CMP perform internally?",
                  "What is the difference between JE and JZ?",
                  "When comparing signed vs unsigned, which jump instructions differ?"],
     "code_challenge":None},

    {"id":"T05-5","topic_number":5,"topic":"Topic 5 – Assembly Language & Arithmetic",
     "question":"Explain the LEA instruction. How does it differ from MOV with a memory operand?",
     "followups":["Why is 'LEA rax, [rbx + rcx*4 + 8]' useful even when not accessing memory?",
                  "Can LEA cause a memory access fault?",
                  "Give an example where LEA replaces a multiply and add."],
     "code_challenge":"Use LEA to compute rax = rbx * 5 without using MUL."},

    # ── TOPIC 6 ──────────────────────────────────────────────────────────────
    {"id":"T06-1","topic_number":6,"topic":"Topic 6 – Memory Addressing, MOV, LEA, Jumps, Loops",
     "question":"List all x86-64 memory addressing modes and give a NASM example of each.",
     "followups":["What is register indirect addressing?",
                  "What is base + displacement addressing?",
                  "What is scaled indexed addressing? What scale factors are allowed?",
                  "What is RIP-relative addressing used for?"],
     "code_challenge":"Write NASM to access the 3rd element (0-indexed) of a dword array at label 'arr' using scaled indexed addressing."},

    {"id":"T06-2","topic_number":6,"topic":"Topic 6 – Memory Addressing, MOV, LEA, Jumps, Loops",
     "question":"What are the operand size rules for MOV? Can you MOV a 64-bit immediate into memory directly?",
     "followups":["What happens when you do 'MOV eax, 1' in 64-bit mode?",
                  "What is MOVZX and MOVSX?",
                  "Why can't you do 'MOV [mem], [mem]' in x86?"],
     "code_challenge":None},

    {"id":"T06-3","topic_number":6,"topic":"Topic 6 – Memory Addressing, MOV, LEA, Jumps, Loops",
     "question":"Explain conditional jumps. How does JG differ from JA?",
     "followups":["What flags does JG check?",
                  "What flags does JA check?",
                  "Give an example where JG and JA produce different results for the same values."],
     "code_challenge":None},

    {"id":"T06-4","topic_number":6,"topic":"Topic 6 – Memory Addressing, MOV, LEA, Jumps, Loops",
     "question":"Show how a C for-loop translates to NASM. Use: for(int i=0; i<10; i++) sum += i;",
     "followups":["Where does the loop condition check go — top or bottom of loop body?",
                  "How is a WHILE loop structurally different from FOR in assembly?",
                  "What is the LOOP instruction and its limitation?"],
     "code_challenge":"Write NASM for: for(int i=1; i<=5; i++) { rax *= i; } — factorial of 5."},

    {"id":"T06-5","topic_number":6,"topic":"Topic 6 – Memory Addressing, MOV, LEA, Jumps, Loops",
     "question":"How is a SWITCH-CASE compiled to assembly? What is a jump table?",
     "followups":["When does the compiler prefer a jump table over a chain of comparisons?",
                  "What x86 instruction implements jump table dispatch?",
                  "What happens if the switch value is out of the table range?"],
     "code_challenge":None},

    # ── TOPIC 7 ──────────────────────────────────────────────────────────────
    {"id":"T07-1","topic_number":7,"topic":"Topic 7 – Stack, Procedures, Stack Frame",
     "question":"Describe how the stack works in x86-64. Which direction does it grow?",
     "followups":["What do PUSH and POP do to RSP?",
                  "What is the stack alignment requirement before a CALL in Linux x86-64 ABI?",
                  "What is a stack overflow and how can it happen?"],
     "code_challenge":"Write NASM code to push 3 values onto the stack and pop them back in original order."},

    {"id":"T07-2","topic_number":7,"topic":"Topic 7 – Stack, Procedures, Stack Frame",
     "question":"Explain the System V AMD64 calling convention: argument passing, return values, preserved registers.",
     "followups":["Which 6 registers hold the first 6 integer arguments?",
                  "What happens when there are more than 6 arguments?",
                  "Which registers must a callee preserve?"],
     "code_challenge":"Write a NASM function 'add_three' that takes 3 integer arguments and returns their sum."},

    {"id":"T07-3","topic_number":7,"topic":"Topic 7 – Stack, Procedures, Stack Frame",
     "question":"What is a stack frame? Describe step-by-step what happens on function call and return.",
     "followups":["What does the prologue of a typical function look like?",
                  "What does the epilogue look like?",
                  "What is RBP used for in a stack frame?",
                  "What is the red zone in x86-64 System V ABI?"],
     "code_challenge":"Draw (in text) the stack frame layout for a function with 2 local variables and 2 arguments."},

    {"id":"T07-4","topic_number":7,"topic":"Topic 7 – Stack, Procedures, Stack Frame",
     "question":"How does recursion work at the assembly level? Explain using factorial as an example.",
     "followups":["Each recursive call — what gets pushed onto the stack?",
                  "What is the base case in assembly and how is it checked?",
                  "What is tail recursion and can the compiler optimize it to a loop?",
                  "What causes a stack overflow in deep recursion?"],
     "code_challenge":"Write a recursive NASM function to compute factorial(n) for n passed in rdi."},

    {"id":"T07-5","topic_number":7,"topic":"Topic 7 – Stack, Procedures, Stack Frame",
     "question":"What is the difference between passing arguments by value vs by reference in assembly?",
     "followups":["How do you pass a large struct to a function?",
                  "How do you return a struct from a function?",
                  "How does the caller know where the callee stored the return struct?"],
     "code_challenge":None},

    # ── TOPIC 8 ──────────────────────────────────────────────────────────────
    {"id":"T08-1","topic_number":8,"topic":"Topic 8 – NASM Preprocessor & Macros",
     "question":"What is the NASM preprocessor? Name three preprocessor directives and their purpose.",
     "followups":["What does %define do?",
                  "What does %include do?",
                  "What is the difference between %define and EQU?"],
     "code_challenge":None},

    {"id":"T08-2","topic_number":8,"topic":"Topic 8 – NASM Preprocessor & Macros",
     "question":"Explain single-line macros in NASM. Write an example of a parameterized single-line macro.",
     "followups":["Can a single-line macro take multiple parameters?",
                  "What is the danger of macros without parentheses around parameters?",
                  "How do you undefine a macro?"],
     "code_challenge":"Write a NASM %define macro SQUARE(x) that expands to (x)*(x)."},

    {"id":"T08-3","topic_number":8,"topic":"Topic 8 – NASM Preprocessor & Macros",
     "question":"Explain multi-line macros in NASM (%macro ... %endmacro). Write an example.",
     "followups":["How do you reference macro arguments inside a multi-line macro?",
                  "What is %0 in a NASM macro?",
                  "How do you create local labels inside a macro to avoid label conflicts?",
                  "What is the difference between %macro and a function/procedure?"],
     "code_challenge":"Write a multi-line NASM macro 'PUSH_ALL' that saves rax, rbx, rcx to the stack."},

    {"id":"T08-4","topic_number":8,"topic":"Topic 8 – NASM Preprocessor & Macros",
     "question":"What are conditional assembly directives in NASM? Give an example of %ifdef.",
     "followups":["What is %if, %elif, %else, %endif?",
                  "How would you use %ifdef to write cross-platform code?"],
     "code_challenge":None},

    {"id":"T08-5","topic_number":8,"topic":"Topic 8 – NASM Preprocessor & Macros",
     "question":"What is the difference between a NASM macro and a procedure? When do you prefer each?",
     "followups":["What overhead does a procedure call have that a macro doesn't?",
                  "What disadvantage do macros have compared to procedures?",
                  "What is code bloat in the context of macros?"],
     "code_challenge":None},

    # ── TOPIC 9 ──────────────────────────────────────────────────────────────
    {"id":"T09-1","topic_number":9,"topic":"Topic 9 – STRUC, ISTRUC, Alignment",
     "question":"What is STRUC in NASM? How do you define and instantiate a structure?",
     "followups":["What is the difference between STRUC and ISTRUC?",
                  "How do you access a field of a STRUC instance in assembly?",
                  "What does the AT keyword do in ISTRUC?"],
     "code_challenge":"Define a NASM STRUC for a Point with x and y as dwords. Instantiate it with values (3, 7)."},

    {"id":"T09-2","topic_number":9,"topic":"Topic 9 – STRUC, ISTRUC, Alignment",
     "question":"What is data alignment? Why does the CPU prefer aligned data?",
     "followups":["What is a misalignment penalty?",
                  "What is the natural alignment of a 4-byte integer?",
                  "Can misaligned access cause a fault on x86?"],
     "code_challenge":None},

    {"id":"T09-3","topic_number":9,"topic":"Topic 9 – STRUC, ISTRUC, Alignment",
     "question":"What is structure padding? Explain why a C compiler adds padding to structs.",
     "followups":["Given: struct { char a; int b; char c; } — what is its size and layout?",
                  "How does __attribute__((packed)) affect padding?",
                  "What is the alignment of the struct itself?"],
     "code_challenge":None},

    {"id":"T09-4","topic_number":9,"topic":"Topic 9 – STRUC, ISTRUC, Alignment",
     "question":"What is the ALIGNB directive in NASM? When would you use it?",
     "followups":["How does ALIGN differ from ALIGNB?",
                  "Why might you align code labels?",
                  "What is the performance benefit of aligning loop entry points?"],
     "code_challenge":None},

    # ── TOPIC 10 ─────────────────────────────────────────────────────────────
    {"id":"T10-1","topic_number":10,"topic":"Topic 10 – Basic Data Types & Arrays",
     "question":"List NASM data definition directives: db, dw, dd, dq. What size is each?",
     "followups":["How do you define an uninitialized variable in BSS section?",
                  "What is the difference between 'db 0' and 'resb 1'?",
                  "How do you define a string in NASM?"],
     "code_challenge":"Define in NASM: an array of 5 dwords initialized to 10, 20, 30, 40, 50."},

    {"id":"T10-2","topic_number":10,"topic":"Topic 10 – Basic Data Types & Arrays",
     "question":"How is a 2D array stored in memory? Explain row-major vs column-major order.",
     "followups":["C uses which order — row-major or column-major?",
                  "For a 3x4 int array 'a', what is the address of a[1][2] given base address B?",
                  "Why does row-major access give better cache performance?"],
     "code_challenge":"Write NASM code to access element [2][3] of a 5x5 dword array at label 'matrix'."},

    {"id":"T10-3","topic_number":10,"topic":"Topic 10 – Basic Data Types & Arrays",
     "question":"How are 3D arrays stored in memory? Give the address formula for element [i][j][k] of an MxNxP array.",
     "followups":["How would you access a 3D array element in NASM?",
                  "What is the stride of the second dimension in a 3D row-major array?"],
     "code_challenge":None},

    {"id":"T10-4","topic_number":10,"topic":"Topic 10 – Basic Data Types & Arrays",
     "question":"What is the difference between a flat 2D array and array-of-pointers (pointer-to-pointer)?",
     "followups":["Which is faster for sequential access and why?",
                  "How does each look in memory differently?"],
     "code_challenge":None},

    # ── TOPIC 11 ─────────────────────────────────────────────────────────────
    {"id":"T11-1","topic_number":11,"topic":"Topic 11 – Memory Layout for Running Application",
     "question":"Describe the memory layout of a running Linux process. List all segments/regions.",
     "followups":["Where is the stack located relative to the heap?",
                  "What is stored in BSS segment? How does it differ from DATA segment?",
                  "Where are loaded shared libraries mapped?",
                  "What is the text segment and what permissions does it have?"],
     "code_challenge":None},

    {"id":"T11-2","topic_number":11,"topic":"Topic 11 – Memory Layout for Running Application",
     "question":"What happens during a memory read or write transaction at the hardware level?",
     "followups":["What is a memory bus?",
                  "What is the difference between a physical and virtual address in a transaction?",
                  "What is ASLR and why is it used?"],
     "code_challenge":None},

    {"id":"T11-3","topic_number":11,"topic":"Topic 11 – Memory Layout for Running Application",
     "question":"Where are the following stored: string literals, global initialized variables, local variables, malloc memory?",
     "followups":["What section holds const char* string literals?",
                  "Where are uninitialized global variables?",
                  "What is the lifetime of stack vs heap memory?"],
     "code_challenge":None},

    # ── TOPIC 12 ─────────────────────────────────────────────────────────────
    {"id":"T12-1","topic_number":12,"topic":"Topic 12 – Memory Hierarchy: Cache",
     "question":"What is CPU cache? Why is it needed? Describe the memory hierarchy levels (L1, L2, L3).",
     "followups":["Typical sizes and latencies for L1, L2, L3 cache?",
                  "What is the difference between instruction cache and data cache?",
                  "What is a unified vs split cache?"],
     "code_challenge":None},

    {"id":"T12-2","topic_number":12,"topic":"Topic 12 – Memory Hierarchy: Cache",
     "question":"Explain how a direct-mapped cache works. How is a memory address split into tag, index, and offset?",
     "followups":["What is a cache conflict miss?",
                  "How many cache lines can a direct-mapped cache with 8 sets hold?",
                  "What is the hit rate in a direct-mapped cache?"],
     "code_challenge":None},

    {"id":"T12-3","topic_number":12,"topic":"Topic 12 – Memory Hierarchy: Cache",
     "question":"What is set-associative cache? Compare 2-way, 4-way, and fully associative.",
     "followups":["What replacement policy is commonly used?",
                  "What is LRU replacement?",
                  "What is a cold miss vs capacity miss vs conflict miss?"],
     "code_challenge":None},

    {"id":"T12-4","topic_number":12,"topic":"Topic 12 – Memory Hierarchy: Cache",
     "question":"What is spatial and temporal locality? How do caches exploit them?",
     "followups":["Give a programming example with good spatial locality.",
                  "Give a programming example with good temporal locality.",
                  "How does loop order affect cache performance in matrix traversal?"],
     "code_challenge":"Write two C loop variants for matrix traversal and explain which is more cache-friendly."},

    {"id":"T12-5","topic_number":12,"topic":"Topic 12 – Memory Hierarchy: Cache",
     "question":"What is write-back vs write-through cache policy? What is a dirty bit?",
     "followups":["What is write allocate?",
                  "What is the disadvantage of write-through?",
                  "What happens on a write miss in write-back cache?"],
     "code_challenge":None},

    # ── TOPIC 13 ─────────────────────────────────────────────────────────────
    {"id":"T13-1","topic_number":13,"topic":"Topic 13 – Memory Hierarchy: DRAM",
     "question":"How does DRAM store data? Why does it need to be refreshed?",
     "followups":["What is the capacitor-transistor cell in DRAM?",
                  "What is refresh rate and why does it consume bus bandwidth?",
                  "How is SRAM different from DRAM?"],
     "code_challenge":None},

    {"id":"T13-2","topic_number":13,"topic":"Topic 13 – Memory Hierarchy: DRAM",
     "question":"Explain the DRAM access sequence: RAS, CAS, data transfer.",
     "followups":["What does RAS stand for? CAS?",
                  "What is CAS latency?",
                  "What is a DRAM bank and why does it matter for access time?"],
     "code_challenge":None},

    {"id":"T13-3","topic_number":13,"topic":"Topic 13 – Memory Hierarchy: DRAM",
     "question":"What is DDR SDRAM? What does DDR mean and how does it double data rate?",
     "followups":["What is the difference between DDR4 and DDR5?",
                  "What is a DIMM?",
                  "What is dual-channel memory and how does it improve bandwidth?"],
     "code_challenge":None},

    # ── TOPIC 14 ─────────────────────────────────────────────────────────────
    {"id":"T14-1","topic_number":14,"topic":"Topic 14 – Memory Hierarchy: HDD and SSD",
     "question":"Describe the physical structure of a Hard Disk Drive. What are platters, tracks, sectors, cylinders?",
     "followups":["What is seek time, rotational latency, and transfer time?",
                  "What is the typical RPM of a modern HDD?",
                  "Why are HDDs so much slower than DRAM?"],
     "code_challenge":None},

    {"id":"T14-2","topic_number":14,"topic":"Topic 14 – Memory Hierarchy: HDD and SSD",
     "question":"How does an SSD differ from an HDD mechanically? How does NAND flash store data?",
     "followups":["What is SLC, MLC, TLC, QLC in NAND flash?",
                  "What is write amplification in SSDs?",
                  "What is wear leveling and why is it needed?",
                  "Why can't flash cells be overwritten without erasing first?"],
     "code_challenge":None},

    {"id":"T14-3","topic_number":14,"topic":"Topic 14 – Memory Hierarchy: HDD and SSD",
     "question":"Compare HDD and SSD: latency, throughput, durability, cost per GB.",
     "followups":["When would you still choose HDD over SSD in 2025?",
                  "What interface do modern SSDs use (NVMe vs SATA)?",
                  "What is the TBW (endurance) rating of an SSD?"],
     "code_challenge":None},

    # ── TOPIC 15 ─────────────────────────────────────────────────────────────
    {"id":"T15-1","topic_number":15,"topic":"Topic 15 – Linkers, Symbols, Libraries",
     "question":"What does a linker do? Describe the compilation pipeline steps before linking.",
     "followups":["What is the difference between compilation and assembly?",
                  "What is an object file (.o)?",
                  "What are the steps: preprocessing → compilation → assembly → linking?"],
     "code_challenge":None},

    {"id":"T15-2","topic_number":15,"topic":"Topic 15 – Linkers, Symbols, Libraries",
     "question":"What is a symbol in linking? What are global, local, and external symbols?",
     "followups":["What is a strong vs weak symbol?",
                  "What happens when two object files define the same global symbol?",
                  "What is 'undefined reference' linker error?"],
     "code_challenge":None},

    {"id":"T15-3","topic_number":15,"topic":"Topic 15 – Linkers, Symbols, Libraries",
     "question":"What is symbol resolution? How does the linker resolve symbols across object files?",
     "followups":["What is relocation and when does it happen?",
                  "What is a relocation entry in an object file?",
                  "How does the linker resolve a reference to a function in another .o file?"],
     "code_challenge":None},

    {"id":"T15-4","topic_number":15,"topic":"Topic 15 – Linkers, Symbols, Libraries",
     "question":"What is the difference between a static library (.a) and a dynamic/shared library (.so)?",
     "followups":["How does the linker include code from a static library?",
                  "What is dynamic linking and when does it resolve symbols?",
                  "What is the PLT and GOT in dynamic linking?",
                  "What is LD_LIBRARY_PATH?"],
     "code_challenge":None},

    {"id":"T15-5","topic_number":15,"topic":"Topic 15 – Linkers, Symbols, Libraries",
     "question":"What are the advantages of dynamic linking over static? What are the disadvantages?",
     "followups":["What is 'DLL hell' (shared library versioning problem)?",
                  "What is position-independent code (PIC) and why is it needed?",
                  "What linker flag creates a shared library?"],
     "code_challenge":None},

    # ── TOPIC 16 ─────────────────────────────────────────────────────────────
    {"id":"T16-1","topic_number":16,"topic":"Topic 16 – Asynchronous & Synchronous Exceptions",
     "question":"What is an exception in computer architecture? Distinguish: interrupts, traps, faults, aborts.",
     "followups":["Which of these are synchronous vs asynchronous?",
                  "What is a hardware interrupt? Give an example.",
                  "What is a page fault and is it recoverable?",
                  "What is a double fault?"],
     "code_challenge":None},

    {"id":"T16-2","topic_number":16,"topic":"Topic 16 – Asynchronous & Synchronous Exceptions",
     "question":"What is an interrupt descriptor table (IDT)? How does the CPU use it on exception?",
     "followups":["What happens step-by-step when a hardware interrupt fires?",
                  "What is an interrupt handler (ISR)?",
                  "What does the CPU save on the stack when an exception occurs?"],
     "code_challenge":None},

    {"id":"T16-3","topic_number":16,"topic":"Topic 16 – Asynchronous & Synchronous Exceptions",
     "question":"What is a system call (syscall)? How does user-space code invoke a syscall in x86-64 Linux?",
     "followups":["What instruction triggers a syscall on x86-64?",
                  "Which registers hold the syscall number and arguments?",
                  "What privilege level change happens during a syscall?"],
     "code_challenge":"Write NASM code that calls the 'write' syscall to print 'Hello' to stdout (fd=1)."},

    # ── TOPIC 17 ─────────────────────────────────────────────────────────────
    {"id":"T17-1","topic_number":17,"topic":"Topic 17 – Processes, Threads, Race Conditions",
     "question":"What is a process? What resources does a process own?",
     "followups":["What is the difference between a process and a thread?",
                  "What is a PCB (Process Control Block)?",
                  "What is a context switch?",
                  "What does 'fork' do at the OS level?"],
     "code_challenge":None},

    {"id":"T17-2","topic_number":17,"topic":"Topic 17 – Processes, Threads, Race Conditions",
     "question":"What is a race condition? Give an example and explain why it is dangerous.",
     "followups":["What is a critical section?",
                  "How do you prevent race conditions?",
                  "What is the difference between a race condition and a data race?"],
     "code_challenge":"Write pseudocode showing a race condition with a shared counter incremented by two threads."},

    {"id":"T17-3","topic_number":17,"topic":"Topic 17 – Processes, Threads, Race Conditions",
     "question":"What is a background job in Unix? How does the shell manage foreground vs background processes?",
     "followups":["What is the difference between & in bash and Ctrl+Z?",
                  "What is a job in shell terminology?",
                  "What happens to a background process when the terminal closes?",
                  "What is nohup?"],
     "code_challenge":None},

    # ── TOPIC 18 ─────────────────────────────────────────────────────────────
    {"id":"T18-1","topic_number":18,"topic":"Topic 18 – Signals, Signal Handlers, Nonlocal Jumps",
     "question":"What is a Unix signal? Give five common signals and what triggers them.",
     "followups":["What is SIGKILL and why can't it be caught or ignored?",
                  "What is SIGTERM vs SIGKILL?",
                  "What is SIGSEGV and what triggers it?",
                  "What is SIGCHLD?"],
     "code_challenge":None},

    {"id":"T18-2","topic_number":18,"topic":"Topic 18 – Signals, Signal Handlers, Nonlocal Jumps",
     "question":"How do you install a signal handler in C? Explain using sigaction().",
     "followups":["What is the difference between signal() and sigaction()?",
                  "What is a reentrant function and why must signal handlers use only reentrant functions?",
                  "What happens to a blocked syscall when a signal arrives?"],
     "code_challenge":"Write a C signal handler for SIGINT that prints 'Caught Ctrl+C' and exits cleanly."},

    {"id":"T18-3","topic_number":18,"topic":"Topic 18 – Signals, Signal Handlers, Nonlocal Jumps",
     "question":"What are nonlocal jumps (setjmp/longjmp)? How do they work?",
     "followups":["What does setjmp save in the jmp_buf?",
                  "What does longjmp do to the stack?",
                  "Give a use case where setjmp/longjmp is useful."],
     "code_challenge":None},

    # ── TOPIC 19 ─────────────────────────────────────────────────────────────
    {"id":"T19-1","topic_number":19,"topic":"Topic 19 – Input/Output, Standard I/O",
     "question":"Describe three types of I/O: programmed I/O, interrupt-driven I/O, and DMA.",
     "followups":["What is busy-waiting (polling) and why is it inefficient?",
                  "How does DMA free the CPU from I/O transfers?",
                  "What is a DMA controller?"],
     "code_challenge":None},

    {"id":"T19-2","topic_number":19,"topic":"Topic 19 – Input/Output, Standard I/O",
     "question":"Explain Unix standard I/O: stdin, stdout, stderr. What are their file descriptors?",
     "followups":["What is I/O redirection in the shell?",
                  "What is a pipe and how does it connect processes?",
                  "What is the difference between buffered and unbuffered I/O?"],
     "code_challenge":"Write NASM code to read a byte from stdin (fd=0) using the read syscall."},

    {"id":"T19-3","topic_number":19,"topic":"Topic 19 – Input/Output, Standard I/O",
     "question":"What is memory-mapped I/O vs port-mapped I/O?",
     "followups":["What x86 instructions are used for port-mapped I/O?",
                  "How does mmap() relate to memory-mapped I/O?",
                  "What is a device file in Linux?"],
     "code_challenge":None},

    # ── TOPIC 20 ─────────────────────────────────────────────────────────────
    {"id":"T20-1","topic_number":20,"topic":"Topic 20 – Virtual Memory & Address Translation",
     "question":"What is virtual memory? What problems does it solve?",
     "followups":["What is address space isolation?",
                  "How does virtual memory allow programs larger than physical RAM?",
                  "What is swapping?"],
     "code_challenge":None},

    {"id":"T20-2","topic_number":20,"topic":"Topic 20 – Virtual Memory & Address Translation",
     "question":"Explain page-based address translation. What is a page table?",
     "followups":["What is a page and what is a frame?",
                  "Typical page size on x86-64?",
                  "What is a page table entry (PTE)?",
                  "How does the OS translate virtual to physical address?"],
     "code_challenge":None},

    {"id":"T20-3","topic_number":20,"topic":"Topic 20 – Virtual Memory & Address Translation",
     "question":"What is the TLB? Why is it needed and how does it speed up address translation?",
     "followups":["What is a TLB miss?",
                  "What is a TLB flush and when does it happen?",
                  "What is ASID (Address Space ID) and how does it reduce TLB flushes?"],
     "code_challenge":None},

    {"id":"T20-4","topic_number":20,"topic":"Topic 20 – Virtual Memory & Address Translation",
     "question":"What is a page fault? Describe the steps the OS takes to handle it.",
     "followups":["What is demand paging?",
                  "What is a segmentation fault vs a page fault?",
                  "What happens when a process accesses a page swapped to disk?"],
     "code_challenge":None},

    {"id":"T20-5","topic_number":20,"topic":"Topic 20 – Virtual Memory & Address Translation",
     "question":"Explain multi-level page tables. Why are they used instead of a single flat page table?",
     "followups":["x86-64 uses how many levels of page tables?",
                  "What is the size of each page table level in x86-64?",
                  "What is the walk through a 4-level page table called?"],
     "code_challenge":None},

    # ── TOPIC 21 ─────────────────────────────────────────────────────────────
    {"id":"T21-1","topic_number":21,"topic":"Topic 21 – Concurrent Programming",
     "question":"What is concurrency? How is it different from parallelism?",
     "followups":["Can concurrency exist on a single-core CPU?",
                  "What is a coroutine? How is it different from a thread?",
                  "What is cooperative vs preemptive multitasking?"],
     "code_challenge":None},

    {"id":"T21-2","topic_number":21,"topic":"Topic 21 – Concurrent Programming",
     "question":"What is a mutex? How does it prevent race conditions?",
     "followups":["What is a deadlock? Give a simple example.",
                  "What is a spinlock and when is it preferable to a sleeping mutex?",
                  "What is a semaphore and how does it differ from a mutex?"],
     "code_challenge":"Write pseudocode for two threads that can deadlock using two mutexes."},

    {"id":"T21-3","topic_number":21,"topic":"Topic 21 – Concurrent Programming",
     "question":"What are condition variables? What problem do they solve?",
     "followups":["Why must a condition variable be used with a mutex?",
                  "What is a spurious wakeup?",
                  "Explain the producer-consumer problem and solve it with a condition variable."],
     "code_challenge":None},

    # ── TOPIC 22 ─────────────────────────────────────────────────────────────
    {"id":"T22-1","topic_number":22,"topic":"Topic 22 – Parallelism & Synchronization",
     "question":"What is Amdahl's Law? What does it tell us about parallel speedup?",
     "followups":["If 90% of code is parallelizable, what is the max speedup with infinite cores?",
                  "What is strong vs weak scaling?",
                  "What is Gustafson's Law?"],
     "code_challenge":None},

    {"id":"T22-2","topic_number":22,"topic":"Topic 22 – Parallelism & Synchronization",
     "question":"What is cache coherence in multiprocessor systems? What problem does it solve?",
     "followups":["What is the MESI protocol?",
                  "What is false sharing and how does it degrade performance?",
                  "How do you avoid false sharing in practice?"],
     "code_challenge":None},

    {"id":"T22-3","topic_number":22,"topic":"Topic 22 – Parallelism & Synchronization",
     "question":"What is a memory barrier (fence)? Why is it needed in concurrent code?",
     "followups":["What is memory reordering by the CPU or compiler?",
                  "What does a store barrier guarantee?",
                  "What is an atomic operation? Give examples from x86."],
     "code_challenge":None},

    {"id":"T22-4","topic_number":22,"topic":"Topic 22 – Parallelism & Synchronization",
     "question":"What is SIMD (Single Instruction Multiple Data)? Give an example of where it helps.",
     "followups":["What are SSE and AVX instruction sets?",
                  "How wide are AVX-512 registers?",
                  "What kind of data parallelism does SIMD exploit?"],
     "code_challenge":None},

    # ── TOPIC 23 ─────────────────────────────────────────────────────────────
    {"id":"T23-1","topic_number":23,"topic":"Topic 23 – Virtual Machines",
     "question":"What is a virtual machine (VM)? What are the two types: Type 1 and Type 2 hypervisors?",
     "followups":["Give examples of Type 1 and Type 2 hypervisors.",
                  "What is the performance difference between Type 1 and Type 2?",
                  "What hardware features does Intel VT-x / AMD-V provide?"],
     "code_challenge":None},

    {"id":"T23-2","topic_number":23,"topic":"Topic 23 – Virtual Machines",
     "question":"What is the difference between a virtual machine and a container (e.g., Docker)?",
     "followups":["Which has lower overhead and why?",
                  "What kernel features power containers (namespaces, cgroups)?",
                  "When would you prefer a VM over a container?"],
     "code_challenge":None},

    {"id":"T23-3","topic_number":23,"topic":"Topic 23 – Virtual Machines",
     "question":"What is a process virtual machine (like JVM)? How does it differ from a system VM?",
     "followups":["What is bytecode and how does the JVM execute it?",
                  "What is JIT compilation?",
                  "What is the benefit of platform-independent bytecode?"],
     "code_challenge":None},

    {"id":"T23-4","topic_number":23,"topic":"Topic 23 – Virtual Machines",
     "question":"How does a hypervisor handle sensitive instructions that a guest OS tries to execute?",
     "followups":["What is trap-and-emulate?",
                  "What is binary translation in virtualization?",
                  "What is paravirtualization?"],
     "code_challenge":None},
]


def seed():
    db.init_db()
    import sqlite3, json
    conn = db.get_conn()
    existing = {r["id"] for r in conn.execute("SELECT id FROM questions").fetchall()}
    added = 0
    skipped = 0
    for q in QUESTIONS:
        if q["id"] in existing:
            skipped += 1
            continue
        conn.execute(
            """INSERT INTO questions (id, topic_number, topic, question, followups, code_challenge)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (q["id"], q["topic_number"], q["topic"], q["question"],
             json.dumps(q["followups"]), q.get("code_challenge")),
        )
        added += 1
    conn.commit()
    conn.close()
    print(f"Seeded: {added} questions added, {skipped} already existed.")
    print(f"Total in DB: {db.stats()['total_questions']}")


if __name__ == "__main__":
    seed()
