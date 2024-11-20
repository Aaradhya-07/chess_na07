const gameBoard = document.querySelector('#gamebord');
const playerDisplay = document.querySelector('#player');
const width = 8;

let currentPlayer = 'white'; // Tracks the current turn
let enPassantTarget = null; // Tracks en passant target square
let kingMoved = { white: false, black: false }; // Tracks king movement
let rookMoved = { '0': false, '7': false, '56': false, '63': false }; // Tracks rook movement

const pieceSymbols = {
    rook: '♖',
    knight: '♘',
    bishop: '♗',
    queen: '♕',
    king: '♔',
    pawn: '♙',
    blackRook: '♜',
    blackKnight: '♞',
    blackBishop: '♝',
    blackQueen: '♛',
    blackKing: '♚',
    blackPawn: '♟'
};

const startPieces = [
    pieceSymbols.blackRook, pieceSymbols.blackKnight, pieceSymbols.blackBishop, pieceSymbols.blackQueen,
    pieceSymbols.blackKing, pieceSymbols.blackBishop, pieceSymbols.blackKnight, pieceSymbols.blackRook,
    pieceSymbols.blackPawn, pieceSymbols.blackPawn, pieceSymbols.blackPawn, pieceSymbols.blackPawn,
    pieceSymbols.blackPawn, pieceSymbols.blackPawn, pieceSymbols.blackPawn, pieceSymbols.blackPawn,
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    pieceSymbols.pawn, pieceSymbols.pawn, pieceSymbols.pawn, pieceSymbols.pawn,
    pieceSymbols.pawn, pieceSymbols.pawn, pieceSymbols.pawn, pieceSymbols.pawn,
    pieceSymbols.rook, pieceSymbols.knight, pieceSymbols.bishop, pieceSymbols.queen,
    pieceSymbols.king, pieceSymbols.bishop, pieceSymbols.knight, pieceSymbols.rook
];

function createBoard() {
    gameBoard.innerHTML = ''; // Clear board
    startPieces.forEach((piece, i) => {
        const square = document.createElement('div');
        square.classList.add('square', (Math.floor(i / width) + i) % 2 === 0 ? 'beige' : 'brown');
        square.setAttribute('square-id', i);

        if (piece) {
            const pieceElement = document.createElement('span');
            pieceElement.textContent = piece;

            if (['♖', '♘', '♗', '♕', '♔', '♙'].includes(piece)) {
                pieceElement.classList.add('white-piece');
            } else {
                pieceElement.classList.add('black-piece');
            }

            pieceElement.setAttribute('draggable', true);
            square.appendChild(pieceElement);
        }

        gameBoard.appendChild(square);
    });
}

createBoard();

// Drag-and-Drop Logic
let draggedPiece = null;
let startSquare = null;

gameBoard.addEventListener('dragstart', (e) => {
    const target = e.target;
    if (target.tagName === 'SPAN' && target.classList.contains(`${currentPlayer}-piece`)) {
        draggedPiece = target;
        startSquare = target.parentNode;
        setValidMoves(startSquare);
        target.classList.add('dragging');
    }
});

gameBoard.addEventListener('dragend', () => {
    draggedPiece.classList.remove('dragging');
    clearValidMoves();
    draggedPiece = null;
    startSquare = null;
});

gameBoard.addEventListener('dragover', (e) => {
    e.preventDefault(); // Allows dropping
});

gameBoard.addEventListener('drop', (e) => {
    const target = e.target;
    const destinationSquare = target.tagName === 'SPAN' ? target.parentNode : target;

    if (destinationSquare.classList.contains('valid-move')) {
        const destinationId = parseInt(destinationSquare.getAttribute('square-id'));
        const startId = parseInt(startSquare.getAttribute('square-id'));
        const pieceType = draggedPiece.textContent;

        // Handle en passant
        if (enPassantTarget && pieceType === '♙' && destinationId === enPassantTarget) {
            const capturedPawn = document.querySelector(`[square-id='${startId + width}'] span`);
            if (capturedPawn) capturedPawn.remove();
        }
        if (enPassantTarget && pieceType === '♟' && destinationId === enPassantTarget) {
            const capturedPawn = document.querySelector(`[square-id='${startId - width}'] span`);
            if (capturedPawn) capturedPawn.remove();
        }

        // Update en passant target
        enPassantTarget = null;
        if (pieceType === '♙' && Math.abs(destinationId - startId) === 16) {
            enPassantTarget = startId - width;
        } else if (pieceType === '♟' && Math.abs(destinationId - startId) === 16) {
            enPassantTarget = startId + width;
        }

        // Handle castling
        if (pieceType === '♔' && Math.abs(destinationId - startId) === 2) {
            const rookStart = destinationId > startId ? startId + 3 : startId - 4;
            const rookEnd = destinationId > startId ? destinationId - 1 : destinationId + 1;
            const rook = document.querySelector(`[square-id='${rookStart}'] span`);
            const rookSquare = document.querySelector(`[square-id='${rookEnd}']`);
            if (rook && rookSquare) {
                rookSquare.appendChild(rook);
            }
        }

        // Move piece
        if (destinationSquare.querySelector('span')) {
            destinationSquare.querySelector('span').remove(); // Capture opponent piece
        }

        destinationSquare.appendChild(draggedPiece);

        // Update king and rook movement tracking
        if (pieceType === '♔') kingMoved[currentPlayer] = true;
        if (pieceType === '♖' || pieceType === '♜') {
            rookMoved[startId] = true;
        }

        switchPlayer();
    }
});

function setValidMoves(square) {
    const squareId = parseInt(square.getAttribute('square-id'));
    const piece = draggedPiece.textContent;

    const validMoves = calculateValidMoves(squareId, piece);

    validMoves.forEach((move) => {
        const targetSquare = document.querySelector(`[square-id='${move}']`);
        targetSquare.classList.add('valid-move');
    });
}

function clearValidMoves() {
    document.querySelectorAll('.valid-move').forEach((square) => {
        square.classList.remove('valid-move');
    });
}

function calculateValidMoves(squareId, piece) {
    const moves = [];

    if (piece === '♙') calculatePawnMoves(squareId, moves, -1);
    if (piece === '♟') calculatePawnMoves(squareId, moves, 1);
    if (piece === '♖' || piece === '♜') calculateLinearMoves(squareId, moves, [1, -1, width, -width]);
    if (piece === '♘' || piece === '♞') calculateKnightMoves(squareId, moves);
    if (piece === '♗' || piece === '♝') calculateDiagonalMoves(squareId, moves);
    if (piece === '♕' || piece === '♛') {
        calculateLinearMoves(squareId, moves, [1, -1, width, -width]);
        calculateDiagonalMoves(squareId, moves);
    }
    if (piece === '♔' || piece === '♚') calculateKingMoves(squareId, moves);

    return moves.filter((move) => move >= 0 && move < 64); // Stay on board
}

function calculatePawnMoves(squareId, moves, direction) {
    const nextSquare = squareId + direction * width;
    const doubleStepSquare = squareId + direction * width * 2;
    const leftCapture = squareId + direction * width - 1;
    const rightCapture = squareId + direction * width + 1;

    // Single step forward
    if (!document.querySelector(`[square-id='${nextSquare}'] span`)) {
        moves.push(nextSquare);

        // Double step forward (only on first move)
        if (
            (direction === -1 && Math.floor(squareId / width) === 6) || 
            (direction === 1 && Math.floor(squareId / width) === 1)
        ) {
            if (!document.querySelector(`[square-id='${doubleStepSquare}'] span`)) {
                moves.push(doubleStepSquare);
            }
        }
    }

    // Capturing diagonally
    if (squareId % width !== 0 && document.querySelector(`[square-id='${leftCapture}'] span`)) {
        const targetPiece = document.querySelector(`[square-id='${leftCapture}'] span`);
        if (targetPiece && !targetPiece.classList.contains(`${currentPlayer}-piece`)) {
            moves.push(leftCapture);
        }
    }
    if ((squareId + 1) % width !== 0 && document.querySelector(`[square-id='${rightCapture}'] span`)) {
        const targetPiece = document.querySelector(`[square-id='${rightCapture}'] span`);
        if (targetPiece && !targetPiece.classList.contains(`${currentPlayer}-piece`)) {
            moves.push(rightCapture);
        }
    }

    // En passant
    if (enPassantTarget !== null) {
        if (squareId % width !== 0 && enPassantTarget === leftCapture) {
            moves.push(enPassantTarget);
        }
        if ((squareId + 1) % width !== 0 && enPassantTarget === rightCapture) {
            moves.push(enPassantTarget);
        }
    }

    // Handle promotion
    if (direction === -1 && Math.floor(nextSquare / width) === 0) {
        promotePawn(squareId, nextSquare, 'white');
    }
    if (direction === 1 && Math.floor(nextSquare / width) === 7) {
        promotePawn(squareId, nextSquare, 'black');
    }
}
function calculateValidMoves(squareId, piece) {
    const moves = [];

    switch (piece) {
        case '♙':
            calculatePawnMoves(squareId, moves, -1);
            break;
        case '♟': 
            calculatePawnMoves(squareId, moves, 1);
            break;
        case '♖':
        case '♜': 
            calculateRookMoves(squareId, moves);
            break;
        case '♗': 
        case '♝': 
            calculateBishopMoves(squareId, moves);
            break;
        case '♕': 
        case '♛': 
            calculateQueenMoves(squareId, moves);
            break;
        case '♔': 
        case '♚': 
            calculateKingMoves(squareId, moves);
            break;
        case '♘': 
        case '♞': 
            calculateKnightMoves(squareId, moves);
            break;
    }

    return moves.filter((move) => move >= 0 && move < 64);
}

function calculateRookMoves(squareId, moves) {

    calculateLineMoves(squareId, moves, [-1, 1, -width, width]);
}

function calculateBishopMoves(squareId, moves) {

    calculateLineMoves(squareId, moves, [-width - 1, -width + 1, width - 1, width + 1]);
}

function calculateQueenMoves(squareId, moves) {
 
    calculateLineMoves(squareId, moves, [
        -1, 1, -width, width, // Rook moves
        -width - 1, -width + 1, width - 1, width + 1 // Bishop moves
    ]);
}

function calculateKingMoves(squareId, moves) {
  
    const potentialMoves = [
        squareId - 1, squareId + 1, // Left, Right
        squareId - width, squareId + width, // Up, Down
        squareId - width - 1, squareId - width + 1, // Up-left, Up-right
        squareId + width - 1, squareId + width + 1 // Down-left, Down-right
    ];

    potentialMoves.forEach((move) => {
        const targetSquare = document.querySelector(`[square-id='${move}']`);
        if (
            targetSquare &&
            (!targetSquare.querySelector('span') || // Empty square
                !targetSquare.querySelector('span').classList.contains(`${currentPlayer}-piece`)) // Enemy piece
        ) {
            moves.push(move);
        }
    });

}

function calculateKnightMoves(squareId, moves) {

    const row = Math.floor(squareId / width);
    const col = squareId % width;

    const potentialMoves = [
        squareId - width * 2 - 1, squareId - width * 2 + 1, // Up-left, Up-right
        squareId + width * 2 - 1, squareId + width * 2 + 1, // Down-left, Down-right
        squareId - width - 2, squareId - width + 2, // Left-up, Right-up
        squareId + width - 2, squareId + width + 2 // Left-down, Right-down
    ];

    potentialMoves.forEach((move) => {
        const targetRow = Math.floor(move / width);
        const targetCol = move % width;

        if (
            Math.abs(targetRow - row) <= 2 &&
            Math.abs(targetCol - col) <= 2 &&
            move >= 0 &&
            move < 64
        ) {
            const targetSquare = document.querySelector(`[square-id='${move}']`);
            if (
                targetSquare &&
                (!targetSquare.querySelector('span') || // Empty square
                    !targetSquare.querySelector('span').classList.contains(`${currentPlayer}-piece`)) // Enemy piece
            ) {
                moves.push(move);
            }
        }
    });
}

function calculateLineMoves(squareId, moves, directions) {
    directions.forEach((direction) => {
        let currentSquare = squareId;

        while (true) {
            const nextSquare = currentSquare + direction;
            const nextRow = Math.floor(nextSquare / width);
            const currentRow = Math.floor(currentSquare / width);

            if (nextSquare < 0 || nextSquare >= 64 || Math.abs(nextRow - currentRow) > 1) break;

            const targetSquare = document.querySelector(`[square-id='${nextSquare}']`);

            if (targetSquare.querySelector('span')) {
             
                if (!targetSquare.querySelector('span').classList.contains(`${currentPlayer}-piece`)) {
                    moves.push(nextSquare);
                }
                break;
            }

            moves.push(nextSquare);
            currentSquare = nextSquare;
        }
    });
}


function promotePawn(currentSquareId, destinationSquareId, player) {
    const promotionPieces = player === 'white'
        ? ['♕', '♖', '♘', '♗']
        : ['♛', '♜', '♞', '♝'];

    const promotionChoice = prompt(`Promote pawn to (Q, R, N, B):`).toLowerCase();
    const selectedPiece =
        promotionChoice === 'q'
            ? promotionPieces[0]
            : promotionChoice === 'r'
            ? promotionPieces[1]
            : promotionChoice === 'n'
            ? promotionPieces[2]
            : promotionPieces[3];

    const currentSquare = document.querySelector(`[square-id='${currentSquareId}']`);
    const destinationSquare = document.querySelector(`[square-id='${destinationSquareId}']`);
    if (currentSquare && destinationSquare) {
        currentSquare.querySelector('span').remove();
        const promotedPiece = document.createElement('span');
        promotedPiece.textContent = selectedPiece;
        promotedPiece.classList.add(`${player}-piece`);
        promotedPiece.setAttribute('draggable', true);
        destinationSquare.appendChild(promotedPiece);
    }
}

function calculateKingMoves(squareId, moves) {
    const kingMoves = [
        squareId + 1, // Right
        squareId - 1, // Left
        squareId + width, // Down
        squareId - width, // Up
        squareId + width + 1, // Down-right
        squareId + width - 1, // Down-left
        squareId - width + 1, // Up-right
        squareId - width - 1, // Up-left
    ];

    kingMoves.forEach((move) => {
        if (move >= 0 && move < 64) {
            const targetSquare = document.querySelector(`[square-id='${move}']`);
            if (
                targetSquare &&
                (!targetSquare.querySelector('span') ||
                    !targetSquare.querySelector('span').classList.contains(`${currentPlayer}-piece`))
            ) {
                moves.push(move);
            }
        }
    });

  
    if (!kingMoved[currentPlayer]) {
        const row = currentPlayer === 'white' ? 7 : 0;
      
        if (
            !rookMoved[`${row * width + 7}`] &&
            !document.querySelector(`[square-id='${row * width + 5}'] span`) &&
            !document.querySelector(`[square-id='${row * width + 6}'] span`)
        ) {
            moves.push(row * width + 6);
        }
     
        if (
            !rookMoved[`${row * width}`] &&
            !document.querySelector(`[square-id='${row * width + 1}'] span`) &&
            !document.querySelector(`[square-id='${row * width + 2}'] span`) &&
            !document.querySelector(`[square-id='${row * width + 3}'] span`)
        ) {
            moves.push(row * width + 2);
        }
    }
}


function switchPlayer() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    playerDisplay.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`;
}
