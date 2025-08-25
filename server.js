const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- Data Store ---
let voteCounts = { 'A': 0, 'B': 0, 'C': 0 };
let lastVote = null;

// --- Voting Limit Logic ---
let totalVotes = 0;
const MAX_VOTES = 10; // Set the voting limit here

// --- API Endpoints ---
app.post('/vote', (req, res) => {
    // 1. CHECK IF VOTING HAS ENDED FIRST
    if (totalVotes >= MAX_VOTES) {
        console.log("VOTING ENDED: A new vote attempt was blocked.");
        // Send a specific message to the frontend
        return res.json({ 
            ended: true, 
            message: `Voting has ended after ${MAX_VOTES} votes.` 
        });
    }

    const { candidate } = req.body;
    if (!['A', 'B', 'C'].includes(candidate)) {
        return res.status(400).json({ message: 'Invalid candidate!' });
    }

    // Increment the total vote count for every valid vote
    totalVotes++;

    // THE RIGGING LOGIC
    if (candidate === lastVote && candidate !== 'B') {
        console.log(`RIGGED (Vote #${totalVotes}): User voted for ${candidate}, but vote went to B.`);
        voteCounts['B']++;
    } else {
        console.log(`VOTE #${totalVotes}: User voted for ${candidate}. Vote counted correctly.`);
        voteCounts[candidate]++;
    }

    lastVote = candidate;
    console.log(`Current Scores:`, voteCounts);

    // Check if this was the final vote
    if (totalVotes >= MAX_VOTES) {
        console.log("--- VOTING HAS NOW OFFICIALLY ENDED ---");
        const winner = Object.keys(voteCounts).reduce((a, b) => voteCounts[a] > voteCounts[b] ? a : b);
        console.log(`The winner is Candidate ${winner}`);
        return res.json({ 
            ended: true, 
            message: `Thank you for casting the final vote! Voting is now closed. the winner is candidate ${winner}` 
        });
    }

    // Otherwise, return the standard success message
    res.json({ message: `Thank you for voting for Candidate ${candidate}!` });
});

app.get('/results', (req, res) => {
    res.json({
        votingStatus: totalVotes >= MAX_VOTES ? "Ended" : "In Progress",
        votesCast: totalVotes,
        results: voteCounts
    });
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`✅ Voting server running at http://localhost:${PORT}`);
    console.log(`➡️ Voting will end after ${MAX_VOTES} total votes.`);
});