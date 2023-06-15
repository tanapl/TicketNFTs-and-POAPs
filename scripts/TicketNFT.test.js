const { expect } = require("chai");
const { ethers } = require("hardhat");

// Configures tests to behave properly based on your progress in the assignment
// Update this constant to 2 when you start Part 2: POAPs
const CURRENT_PART = 2;

// Units are "seconds"
const ONE_DAY = 60 * 60 * 24;

const TEN_TOKENS = ethers.utils.parseEther("10");
const TWENTY_TOKENS = ethers.utils.parseEther("20");
const THIRTY_TOKENS = ethers.utils.parseEther("30");

// -----------------------------------------------
// Hard-Coded for Henkaku CIT Intro to Web3 Course
// -----------------------------------------------
//
// Units are "seconds" not "milliseconds"
// (Thu May 07 2022 01:00:00) <=> 1651971600 (sec)
// (Thu Jun 08 2023 01:00:00) <=> 1686186000 (sec)
const PAST_EVENT_START_TIME_UTC = 1651971600;
const FUTURE_EVENT_START_TIME_UTC = 1686186000;
// -----------------------------------------------

// ----------------------------------------------------------
// Replace Hard-Coded Version Above with this for General Use
// ----------------------------------------------------------
//
// Units are "seconds" not "milliseconds"
// const PAST_EVENT_START_TIME_UTC = Math.floor(new Date().getTime() / 1000) - ONE_DAY;
// const FUTURE_EVENT_START_TIME_UTC = Math.floor(new Date().getTime() / 1000) + ONE_DAY;
// ----------------------------------------------------------

// ----------------------------------------------------------
// Setting Up Test User Accounts ("Fixtures")
// ----------------------------------------------------------
//
// In the setupFixtures function below, we'll create a few test user accounts and mint them some
// cJPY tokens. We'll also approve the TicketNFT contract to spend some of those cJPY tokens on
// behalf of each test user.
//
// The following is a breakdown of the initial state of each test user account in our test suite.
//
//   User   | Whitelisted cJPY User | Starting cJPY Balance | TicketNFT Allowance
//   -------|-----------------------|-----------------------|-------------------
//   Owner  |         Yes           |       10 cJPY         |      10 cJPY
//   Alice  |         Yes           |       20 cJPY         |      10 cJPY
//   Bobby  |         Yes           |        0 cJPY         |      10 cJPY
//   Carol  |         Yes           |       20 cJPY         |       0 cJPY
//   David  |         No            |        0 cJPY         |       0 cJPY
//
// Owner:
//   A special role. In addition to being a whitelisted cJPY user, owner is the account that
//   deploys all contracts and handles the initial setup, including minting other test users
//   their initial cJPY balances.
//
// Alice:
//   A regular whitelisted cJPY user and starts with a balance of 20 cJPY.
//   She has approved the TicketNFT contract to transfer 10 cJPY on her behalf.
//
// Bobby:
//   A whitelisted cJPY user, but he starts with no cJPY in his account. However, he has
//   approved the TicketNFT contract to transfer 10 cJPY on his behalf - he'll just have
//   to get some cJPY from somewhere first...
//
// Carol:
//   Carol is a whitelisted cJPY user with a starting balance of 20 cJPY. She has not yet approved
//   the TicketNFT contract to transfer any cJPY on her behalf.
//
// David:
//   David is not a whitelisted cJPY user and starts with no cJPY in his account.
//   He has not given any allowance to the TicketNFT contract.
const setupFixtures = async (name, symbol, startTime) => {
  let owner, alice, bobby, carol, david;
  let Registry, registry, CJPY, cJPY, TicketNFT, ticketNFT, POAP, poap;

  // Get signers (test user accounts)
  [owner, alice, bobby, carol, david] = await ethers.getSigners();

  // Deploy Registry contract
  Registry = await ethers.getContractFactory("Registry");
  registry = await Registry.deploy();
  await registry.deployed();

  // Deploy cJPY contract
  CJPY = await ethers.getContractFactory("CJPY");
  cJPY = await CJPY.deploy(registry.address);
  await cJPY.deployed();

  // Deploy TicketNFT contract
  TicketNFT = await ethers.getContractFactory("TicketNFT");
  ticketNFT = await TicketNFT.deploy(
    `${name} Tickets`,
    `${symbol}T`,
    cJPY.address,
    startTime,
    TEN_TOKENS,
  );
  await ticketNFT.deployed();

  // Deploy POAP contract
  if (CURRENT_PART === 2) {
    POAP = await ethers.getContractFactory("POAP");
    poap = await POAP.deploy(
      `${name} POAP`,
      `${symbol}P`,
      ticketNFT.address,
    );
    await poap.deployed();
  }

  // Add test users to the Registry whitelist
  await registry.connect(owner).bulkAddToWhitelist([
    ethers.constants.AddressZero,
    owner.address,
    alice.address,
    bobby.address,
    carol.address,
    ticketNFT.address,
  ]);

  // Mint cJPY tokens to test users
  await cJPY.connect(owner).mint(owner.address, TWENTY_TOKENS);
  await cJPY.connect(owner).mint(alice.address, TWENTY_TOKENS);
  await cJPY.connect(owner).mint(carol.address, TWENTY_TOKENS);

  // Approve the TicketNFT contract to spend cJPY tokens on behalf of test users
  await cJPY.connect(owner).approve(ticketNFT.address, TWENTY_TOKENS);
  await cJPY.connect(alice).approve(ticketNFT.address, TWENTY_TOKENS);
  await cJPY.connect(bobby).approve(ticketNFT.address, TWENTY_TOKENS);

  // Return fixtures
  return { owner, alice, bobby, carol, david, registry, cJPY, ticketNFT, poap };
};
// ----------------------------------------------------------

describe("Event Tickets & POAPs", function () {

  describe("Initializing Our Contracts", function () {

    let fixtures;
    beforeEach(async function () {
      fixtures = await setupFixtures("Chiba Hill", "CH", FUTURE_EVENT_START_TIME_UTC);
    });

    it("Should correctly initialize the TicketNFT contract", async function () {
      const { owner, cJPY, ticketNFT } = fixtures;
      expect(await ticketNFT.name()).to.equal("Chiba Hill Tickets");
      expect(await ticketNFT.symbol()).to.equal("CHT");
      expect(await ticketNFT.cJPYToken()).to.equal(cJPY.address);
      expect(await ticketNFT.owner()).to.equal(owner.address);
      expect(await ticketNFT.startTime()).to.equal(FUTURE_EVENT_START_TIME_UTC);
      expect(await ticketNFT.ticketPrice()).to.equal(TEN_TOKENS);
      expect(await ticketNFT.ticketCounter()).to.equal(0);
    });

    it("Should correctly initialize the POAP contract", async function () {
      const { ticketNFT, poap } = fixtures;
      expect(await poap.name()).to.equal("Chiba Hill POAP");
      expect(await poap.symbol()).to.equal("CHP");
      expect(await poap.ticketNFT()).to.equal(ticketNFT.address);
      expect(await poap.poapCounter()).to.equal(0);
    });
   });

  describe("Before the Event Starts", function () {

    let fixtures;
    beforeEach(async function () {
      fixtures = await setupFixtures("Future Event", "FE", FUTURE_EVENT_START_TIME_UTC);
    });

    it("Should allow ticket minting by whitelist members", async function () {
      const { alice, cJPY, ticketNFT } = fixtures;

      // Initial State
      expect(await cJPY.balanceOf(ticketNFT.address)).to.equal(0);
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(0);

      // Action
      await ticketNFT.connect(alice).mint(alice.address);

      // Final State
      expect(await cJPY.balanceOf(ticketNFT.address)).to.equal(TEN_TOKENS);
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(1);
      expect(await ticketNFT.ownerOf(1)).to.equal(alice.address);
    });

    it("Should allow whitelist members to buy tickets for other people", async function () {
      const { alice, bobby, cJPY, ticketNFT } = fixtures;

      // Initial State
      expect(await cJPY.balanceOf(ticketNFT.address)).to.equal(0);
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(0);
      expect(await ticketNFT.balanceOf(bobby.address)).to.equal(0);

      // Action
      await ticketNFT.connect(alice).mint(bobby.address);

      // Final State
      expect(await cJPY.balanceOf(ticketNFT.address)).to.equal(TEN_TOKENS);
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(0);
      expect(await ticketNFT.balanceOf(bobby.address)).to.equal(1);
      expect(await ticketNFT.ownerOf(1)).to.equal(bobby.address);
    });

    it("Should correctly increment ticket ids when multiple tickets are minted", async function () {
      const { alice, bobby, cJPY, ticketNFT } = fixtures;

      // Initial State
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(0);
      expect(await ticketNFT.balanceOf(bobby.address)).to.equal(0);

      // Action
      await cJPY.connect(alice).transfer(bobby.address, TEN_TOKENS);
      await ticketNFT.connect(alice).mint(alice.address);
      await ticketNFT.connect(bobby).mint(bobby.address);

      // Final State
      expect(await ticketNFT.ownerOf(1)).to.equal(alice.address);
      expect(await ticketNFT.ownerOf(2)).to.equal(bobby.address);
    });

    it("Should correctly update ticket ownership when a ticket is transferred", async function () {
      const { alice, bobby, ticketNFT } = fixtures;

      // Initial State
      await ticketNFT.connect(alice).mint(alice.address);
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(1);
      expect(await ticketNFT.balanceOf(bobby.address)).to.equal(0);
      expect(await ticketNFT.ownerOf(1)).to.equal(alice.address);

      // Action
      await ticketNFT.connect(alice).transferFrom(alice.address, bobby.address, 1);

      // Final State
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(0);
      expect(await ticketNFT.balanceOf(bobby.address)).to.equal(1);
      expect(await ticketNFT.ownerOf(1)).to.equal(bobby.address);
    });

    it("Should prevent ticket minting by non-whitelist members", async function () {
      const { david, ticketNFT } = fixtures;
      await expect(ticketNFT.connect(david).mint(david.address)).to.be.revertedWith("Insufficient cJPY balance.");
    });

    it("Should prevent ticket minting if the customer has an insufficient cJPY balance", async function () {
      const { bobby, cJPY, ticketNFT } = fixtures;

      // Initial State
      expect(await cJPY.balanceOf(bobby.address)).to.equal(0);
      expect(await ticketNFT.balanceOf(bobby.address)).to.equal(0);

      // Action
      await expect(ticketNFT.connect(bobby).mint(bobby.address)).to.be.revertedWith("Insufficient cJPY balance.");

      // Final State
      expect(await cJPY.balanceOf(bobby.address)).to.equal(0);
      expect(await ticketNFT.balanceOf(bobby.address)).to.equal(0);
    });

    it("Should prevent ticket minting if sender hasn't approved the contract first", async function () {
      const { owner, carol, cJPY, ticketNFT } = fixtures;

      // Initial State
      expect(await cJPY.balanceOf(carol.address)).to.equal(TWENTY_TOKENS);
      expect(await cJPY.allowance(carol.address, ticketNFT.address)).to.equal(0);
      expect(await ticketNFT.balanceOf(carol.address)).to.equal(0);

      // Action
      await expect(ticketNFT.connect(carol).mint(carol.address)).to.be.revertedWith("ERC20: insufficient allowance");
      await cJPY.connect(carol).approve(ticketNFT.address, TEN_TOKENS);
      expect(await cJPY.allowance(carol.address, ticketNFT.address)).to.equal(TEN_TOKENS);
      await ticketNFT.connect(carol).mint(carol.address);

      // Final State
      expect(await cJPY.balanceOf(carol.address)).to.equal(TEN_TOKENS);
      expect(await cJPY.allowance(carol.address, ticketNFT.address)).to.equal(0);
      expect(await ticketNFT.balanceOf(carol.address)).to.equal(1);
    });

    it("Should allow the owner to update the ticket price", async function () {
      const { owner, ticketNFT } = fixtures;

      // Initial State
      const oldTicketPrice = await ticketNFT.ticketPrice();

      // Action
      await ticketNFT.connect(owner).updateTicketPrice(TWENTY_TOKENS);

      // Final State
      expect(await ticketNFT.ticketPrice()).not.to.equal(oldTicketPrice);
      expect(await ticketNFT.ticketPrice()).to.equal(TWENTY_TOKENS);
    });

    it("Should prevent non-owners from updating the ticket price", async function () {
      const { alice, ticketNFT } = fixtures;

      // Initial State
      const oldTicketPrice = await ticketNFT.ticketPrice();

      // Action
      await expect(ticketNFT.connect(alice).updateTicketPrice(TWENTY_TOKENS)).to.be.revertedWith("Caller is not the owner.");

      // Final State
      expect(await ticketNFT.ticketPrice()).to.equal(oldTicketPrice);
    });

    it("Should allow the owner to withdraw cJPY tokens when there is a positive balance", async function () {
      const { owner, alice, cJPY, ticketNFT } = fixtures;

      // Initial State
      expect(await cJPY.balanceOf(owner.address)).to.equal(TWENTY_TOKENS);
      expect(await cJPY.balanceOf(alice.address)).to.equal(TWENTY_TOKENS);
      expect(await cJPY.balanceOf(ticketNFT.address)).to.equal(0);

      // Action
      await ticketNFT.connect(alice).mint(alice.address);
      expect(await cJPY.balanceOf(ticketNFT.address)).to.equal(TEN_TOKENS);
      await ticketNFT.connect(owner).withdraw(TEN_TOKENS);

      // Final State
      expect(await cJPY.balanceOf(owner.address)).to.equal(THIRTY_TOKENS);
      expect(await cJPY.balanceOf(alice.address)).to.equal(TEN_TOKENS);
      expect(await cJPY.balanceOf(ticketNFT.address)).to.equal(0);
    });

    it("Should prevent the owner from withdrawing more cJPY tokens than are in the contract", async function () {
      const { owner, alice, cJPY, ticketNFT } = fixtures;

      // Initial State
      expect(await cJPY.balanceOf(owner.address)).to.equal(TWENTY_TOKENS);
      expect(await cJPY.balanceOf(alice.address)).to.equal(TWENTY_TOKENS);
      expect(await cJPY.balanceOf(ticketNFT.address)).to.equal(0);

      // Action
      await ticketNFT.connect(alice).mint(alice.address);
      expect(await cJPY.balanceOf(ticketNFT.address)).to.equal(TEN_TOKENS);
      await expect(ticketNFT.connect(owner).withdraw(TWENTY_TOKENS)).to.be.revertedWith("Insufficient contract balance.");

      // Final State
      expect(await cJPY.balanceOf(owner.address)).to.equal(TWENTY_TOKENS);
      expect(await cJPY.balanceOf(alice.address)).to.equal(TEN_TOKENS);
      expect(await cJPY.balanceOf(ticketNFT.address)).to.equal(TEN_TOKENS);
    });

    it("Should prevent non-owner from withdrawing cJPY tokens", async function () {
      const { alice, ticketNFT } = fixtures;

      // Action
      await expect(ticketNFT.connect(alice).withdraw(TEN_TOKENS)).to.be.revertedWith("Caller is not the owner.");
    });

    it("Should prevent minting of POAP tokens before the event", async function () {
      const { alice, ticketNFT, poap } = fixtures;

      // Initial State
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(0);
      expect(await poap.balanceOf(alice.address)).to.equal(0);

      // Action
      await ticketNFT.connect(alice).mint(alice.address);
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(1);
      await expect(poap.connect(alice).mint(1)).to.be.revertedWith("Event hasn't started yet.");

      // Final State
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(1);
      expect(await poap.balanceOf(alice.address)).to.equal(0);
    });
  });

  describe("After the Event Starts", function () {

    let fixtures;
    beforeEach(async function () {
      fixtures = await setupFixtures("Past Event", "PE", PAST_EVENT_START_TIME_UTC);
      await fixtures.ticketNFT.connect(fixtures.owner).mint(fixtures.alice.address);
    });

    it("Should allow the owner to mint tickets on behalf of whitelist members", async function () {
      const { owner, alice, ticketNFT } = fixtures;

      // Initial State
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(1);

      // Action
      await ticketNFT.connect(owner).mint(alice.address);

      // Final State
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(2);
      expect(await ticketNFT.ownerOf(2)).to.equal(alice.address);
    });

    it("Should prevent ticket minting by anyone else", async function () {
      const { alice, bobby, carol, ticketNFT } = fixtures;

      // Initial State
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(1);
      expect(await ticketNFT.balanceOf(bobby.address)).to.equal(0);
      expect(await ticketNFT.balanceOf(carol.address)).to.equal(0);

      // Action
      await expect(ticketNFT.connect(alice).mint(alice.address)).to.be.revertedWith("Event already started. Ticket sales are finished!");
      await expect(ticketNFT.connect(bobby).mint(bobby.address)).to.be.revertedWith("Event already started. Ticket sales are finished!");
      await expect(ticketNFT.connect(alice).mint(carol.address)).to.be.revertedWith("Event already started. Ticket sales are finished!");

      // Final State
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(1);
      expect(await ticketNFT.balanceOf(bobby.address)).to.equal(0);
      expect(await ticketNFT.balanceOf(carol.address)).to.equal(0);
    });

    it("Should allow ticket holders to redeem a POAP token (and should burn their ticket)", async function () {
      const { alice, ticketNFT, poap } = fixtures;

      // Initial State
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(1);
      expect(await ticketNFT.ownerOf(1)).to.equal(alice.address);
      expect(await poap.balanceOf(alice.address)).to.equal(0);

      // Action
      await poap.connect(alice).mint(1);

      // Final State
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(0);
      await expect(ticketNFT.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID");
      expect(await poap.balanceOf(alice.address)).to.equal(1);
    });

    it("Should prevent claiming a POAP token with an invalid ticket", async function () {
      const { bobby, ticketNFT, poap } = fixtures;

      // Initial State
      expect(await poap.poapCounter()).to.equal(0);
      await expect(ticketNFT.ownerOf(2)).to.be.revertedWith("ERC721: invalid token ID");

      // Action
      await expect(poap.connect(bobby).mint(2)).to.be.revertedWith("ERC721: invalid token ID");

      // Final State
      expect(await poap.poapCounter()).to.equal(0);
    });

    it("Should prevent redeeming a POAP token twice with the same ticket", async function () {
      const { alice, ticketNFT, poap } = fixtures;

      // Initial State
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(1);
      expect(await poap.balanceOf(alice.address)).to.equal(0);

      // Action
      await poap.connect(alice).mint(1);
      await expect(poap.connect(alice).mint(1)).to.be.revertedWith("ERC721: invalid token ID");

      // Final State
      expect(await ticketNFT.balanceOf(alice.address)).to.equal(0);
      expect(await poap.balanceOf(alice.address)).to.equal(1);
    });
  });
});
