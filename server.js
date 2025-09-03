const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// --- Middleware ---
// Allows the server to understand JSON and serve the HTML file
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- Data Store (Server's Memory) ---
let voteCounts = { 'A': 0, 'B': 0, 'C': 0 };
let lastVote = null;
let totalVotes = 0;
const MAX_VOTES = 10; // Set the voting limit here

// --- API Endpoints ---

// Endpoint to handle a new vote
app.post('/vote', (req, res) => {
    // 1. CHECK IF VOTING HAS ALREADY ENDED
    if (totalVotes >= MAX_VOTES) {
        console.log("VOTING ENDED: A new vote attempt was blocked.");
        return res.json({ 
            ended: true, 
            message: `Voting has already ended after ${MAX_VOTES} votes.`,
            voteCounts: voteCounts
        });
    }

    // 2. GET AND VALIDATE THE CANDIDATE
    const { candidate } = req.body;
    if (!['A', 'B', 'C'].includes(candidate)) {
        return res.status(400).json({ message: 'Invalid candidate!' });
    }

    // 3. PROCESS THE VOTE
    totalVotes++;

    // The rigging logic
    if (candidate === lastVote && candidate !== 'B') {
        console.log(`RIGGED (Vote #${totalVotes}): User voted for ${candidate}, but vote went to B.`);
        voteCounts['B']++;
    } else {
        console.log(`VOTE #${totalVotes}: User voted for ${candidate}. Vote counted correctly.`);
        voteCounts[candidate]++;
    }

    lastVote = candidate;
    console.log(`Current Scores:`, voteCounts);

    // 4. CHECK IF THIS WAS THE FINAL VOTE
    if (totalVotes >= MAX_VOTES) {
        console.log("--- VOTING HAS NOW OFFICIALLY ENDED ---");
        const winner = Object.keys(voteCounts).reduce((a, b) => voteCounts[a] > voteCounts[b] ? a : b);
        console.log(`The winner is Candidate ${winner}`);
        return res.json({ 
            ended: true, 
            message: `Thank you for casting the final vote! The winner is Candidate ${winner}.`,
            voteCounts: voteCounts // Send final counts
        });
    }

    // 5. IF VOTING IS STILL ON, SEND A STANDARD RESPONSE
    res.json({ 
        message: `Thank you for voting for Candidate ${candidate}!`,
        voteCounts: voteCounts // Send current counts
    });
});

// Endpoint to reset the election
app.get('/reset', (req, res) => {
    voteCounts = { 'A': 0, 'B': 0, 'C': 0 };
    lastVote = null;
    totalVotes = 0;
    
    console.log("--- SERVER STATE HAS BEEN RESET ---");
    
    res.json({ 
        message: "Server has been reset successfully!",
        voteCounts: voteCounts // Send the reset counts
    });
});

// Endpoint to get the current results
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