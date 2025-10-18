// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CheckInStreak {
    // Events
    event CheckInSent(address indexed user, uint256 timestamp, uint256 streak, uint256 usdcClaimed);
    event StreakBroken(address indexed user, uint256 previousStreak);
    event NewUser(address indexed user);
    event USDCDeposited(address indexed depositor, uint256 amount);
    event USDCWithdrawn(address indexed user, uint256 amount);
    event ClaimAmountUpdated(uint256 newAmount);

    // Struct to store user data
    struct UserData {
        uint256 currentStreak;      
        uint256 longestStreak;      
        uint256 totalCheckIns;           
        uint256 lastCheckInTimestamp;   
        uint256 lastCheckInDay;          
        bool isRegistered;          
    }

    // Struct to track withdrawable USDC
    struct Withdrawable {
        uint256 amount;
        bool pending;
    }

    // State variables
    mapping(address => UserData) public users;
    mapping(address => Withdrawable) public withdrawableUSDC; // Tracks owner withdrawals
    IERC20 public immutable usdc; // USDC contract address (6 decimals)
    address public immutable owner;
    uint256 public claimAmount = 10000; // Fixed 0.01 USDC per check-in (6 decimals: 10,000 units)
    uint256 public constant SECONDS_PER_DAY = 86400;

    // Modifier to restrict functions to owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Modifier to ensure one check-in per day
    modifier oncePerDay() {
        uint256 currentDay = getCurrentDay();
        require(users[msg.sender].lastCheckInDay != currentDay, "Already checked in today! Come back tomorrow");
        _;
    }

    // Constructor sets the USDC contract address and owner
    constructor() {
        usdc = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913); // USDC on Base
        owner = msg.sender;
    }

    // Check-in function with integrated fixed USDC claim
    function checkIn() external oncePerDay {
        UserData storage user = users[msg.sender];
        uint256 currentDay = getCurrentDay();

        // Register new user
        if (!user.isRegistered) {
            user.isRegistered = true;
            emit NewUser(msg.sender);
        }

        // Update streak
        uint256 yesterday = currentDay > 0 ? currentDay - 1 : 0;
        if (user.totalCheckIns == 0) {
            user.currentStreak = 1;
        } else if (user.lastCheckInDay == yesterday) {
            user.currentStreak++;
        } else if (user.lastCheckInDay < yesterday) {
            if (user.currentStreak > 0) {
                emit StreakBroken(msg.sender, user.currentStreak);
            }
            user.currentStreak = 1;
        }

        // Update longest streak
        if (user.currentStreak > user.longestStreak) {
            user.longestStreak = user.currentStreak;
        }

        // Update user data
        user.totalCheckIns++;
        user.lastCheckInTimestamp = block.timestamp;
        user.lastCheckInDay = currentDay;

        // Claim fixed USDC amount
        uint256 usdcAmount = claimAmount; // Fixed 0.01 USDC per check-in
        if (usdcAmount > 0 && usdc.balanceOf(address(this)) >= usdcAmount) {
            SafeERC20.safeTransfer(usdc, msg.sender, usdcAmount);
        } else {
            usdcAmount = 0; // No USDC transferred if insufficient balance
        }

        emit CheckInSent(msg.sender, block.timestamp, user.currentStreak, usdcAmount);
    }

    // Return current streak for a user
    function getCurrentStreak(address _user) external view returns (uint256) {
        return users[_user].currentStreak;
    }

    // Return longest streak for a user
    function getLongestStreak(address _user) external view returns (uint256) {
        return users[_user].longestStreak;
    }

    // Deposit USDC into the contract (by anyone)
    function depositUSDC(uint256 amount) external {
        require(amount > 0, "Deposit amount must be greater than 0");
        // Update state before external call (Checks-Effects-Interactions)
        emit USDCDeposited(msg.sender, amount);
        SafeERC20.safeTransferFrom(usdc, msg.sender, address(this), amount);
    }

    // Request withdrawal of all USDC (only owner)
    function requestWithdrawAllUSDC() external onlyOwner {
        require(!withdrawableUSDC[msg.sender].pending, "Withdrawal already pending");
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No USDC to withdraw");
        withdrawableUSDC[msg.sender] = Withdrawable({amount: balance, pending: true});
        emit USDCWithdrawn(msg.sender, balance);
    }

    // Claim pending withdrawal
    function claimWithdrawal() external {
        Withdrawable storage withdrawal = withdrawableUSDC[msg.sender];
        require(withdrawal.pending, "No pending withdrawal");
        uint256 amount = withdrawal.amount;
        withdrawal.amount = 0;
        withdrawal.pending = false;
        SafeERC20.safeTransfer(usdc, msg.sender, amount);
    }

    // Update the fixed claim amount (only owner)
    function updateClaimAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "New claim amount must be greater than 0");
        claimAmount = newAmount;
        emit ClaimAmountUpdated(newAmount);
    }

    // Helper function to get current day
    function getCurrentDay() public view returns (uint256) {
        return block.timestamp / SECONDS_PER_DAY;
    }

function getLastCheckInDay(address user) public view returns (uint256) {
    return users[user].lastCheckInDay;
}
}