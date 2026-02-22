const archs = ["Intel-x86", "Intel-x64", "ARM64", "ARM32"]
const codeOutput = document.getElementById("codeOutput");
const dataInput = document.getElementById("dataInput");
const caseLower = document.getElementById('caseLower');
const caseUpper = document.getElementById('caseUpper');
const copyButton = document.getElementById('copyButton');

let hash = window.location.hash.substring(1);
let hashTimeout;
let currentInput = "";
let selectedArch = "";
let selectedCase = "";

function upperCase(str) {
    return str.toUpperCase().replace(/(?<=0)X/g, 'x');
} 

function strToHex(str) {
  let res = "";
  
  for (let match of str.matchAll(/\\x([0-9A-Fa-f]{2})|./gs)) 
    if (match[1])
      res += match[1].toUpperCase();
    else 
      res += match[0].charCodeAt(0).toString(16).padStart(2, '0');    

  return res;
}

function getArchBytes(arch) {
    return (arch === 'Intel-x64' || arch === 'ARM64') ? 8 : 4
}

function splitString(hex, bytes) {
    let pieces = [];
    for (let i = hex.length; i >= 0; i -= bytes * 2) {
        pieces.push(hex.substring(Math.max(0, i - bytes * 2), i).padStart(bytes * 2, "0"));
    }
    return pieces.reverse();
}

function buildAsmCode(pieces) {
    let code = "";
    switch (selectedArch) {
        case "Intel-x86":
            for(let i = 0; i < pieces.length; i++) {
                code += `mov eax, 0x${pieces[i]}\n`;
                code += `push eax\n`;
            }
            break;
        case "Intel-x64":
            for(let i = 0; i < pieces.length; i++) {
                code += `mov rax, 0x${pieces[i]}\n`;
                code += `push rax\n`;
            }
            break;
        case "ARM64":
            for(let i = 0; i < pieces.length; i++) {
                code += `ldr x0, 0x${pieces[i]}\n`
                code += `str x0, [sp, #-16]!\n`
            }
            break
        case "ARM32":
            for(let i = 0; i < pieces.length; i++) {
                code += `ldr r0, =0x${pieces[i]}\n`
                code += `push {r0}\n`
            }
            break
        default:
            alert("Invalid arch");
            break;
        }
    if (selectedCase !== 'lower' && selectedCase !== "upper") alert("Invalid case");
    else return (selectedCase === 'lower') ? code : upperCase(code);
}

function updateCode() {
    codeOutput.textContent = buildAsmCode(splitString(strToHex(currentInput), getArchBytes(selectedArch)), selectedArch);
    Prism.highlightElement(codeOutput);
}

function getHashParams() {
    const params = new URLSearchParams(window.location.hash.substring(1));    
    selectedArch = decodeURIComponent(params.get("arch") || "Intel-x86"),
    selectedCase = decodeURIComponent(params.get("case") || "lower"),
    currentInput = decodeURIComponent(params.get("input") || "")
}

function sync() {
    getHashParams();
    updateInputs();
    updateCode();
}

function updateHash() {
    window.location.hash = `arch=${encodeURIComponent(selectedArch)}&case=${encodeURIComponent(selectedCase)}&input=${encodeURIComponent(currentInput)}`;
}

function updateHashParams() {
    const params = new URLSearchParams(hash);
    selectedArch = decodeURIComponent(params.get("arch")) || "Intel-x86";
    selectedCase = decodeURIComponent(params.get("case")) || "lower";
    currentInput = decodeURIComponent(params.get("input")) || "";
}

function updateInputs() {
    document.querySelectorAll('.arch-card').forEach(c => {
        c.classList.remove('border-primary', 'bg-primary', 'bg-opacity-50');
        c.classList.add('border-secondary', 'bg-secondary', 'bg-opacity-25');
    });

    const selCard = document.querySelector(`[data-arch="${selectedArch}"]`);
    if (selCard) {
        selCard.classList.remove('border-secondary', 'bg-secondary', 'bg-opacity-25');
        selCard.classList.add('border-primary', 'bg-primary', 'bg-opacity-50');
    }

    selectedCase == 'lower' ? caseLower.checked = true : caseUpper.checked = true;
    dataInput.value = currentInput;
}

copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(codeOutput.textContent);

    copyButton.innerText = "Copied!";
    setInterval(() => {
        copyButton.innerText = "Copy";
    }, 1200);
});

dataInput.addEventListener('input', () => {
    currentInput = dataInput.value;
    updateCode();

    clearTimeout(hashTimeout);

    hashTimeout = setTimeout(() => {
        updateHash();
    }, 1000);
});

window.addEventListener("load", sync);
window.addEventListener("hashchange", sync);

caseLower.addEventListener('change', () => {
    selectedCase = 'lower';
    updateCode();
    updateHash();
});

caseUpper.addEventListener('change', () => {
    selectedCase = 'upper';
    updateCode();
    updateHash();
}); 

document.querySelectorAll('.arch-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.arch-card').forEach(c => {
            c.classList.remove('border-primary', 'bg-primary', 'bg-opacity-50');
            c.classList.add('border-secondary', 'bg-secondary', 'bg-opacity-25');
        });
        card.classList.remove('border-secondary', 'bg-secondary', 'bg-opacity-25');
        card.classList.add('border-primary', 'bg-primary', 'bg-opacity-50');
        selectedArch = card.dataset.arch;
        updateCode();
        updateHash();
    });
});
