import {
    createWalletClient,
    custom,
    formatEther,
    parseEther,
    defineChain,
    createPublicClient,
    WalletClient,
    PublicClient,
    Chain,
    Address,
    Hash,
} from "viem"
import "viem/window"
import { abi, contractAddress } from "./constants-js.js"

// Type declarations for DOM elements
const connectButton = document.getElementById("connectButton") as HTMLButtonElement
const fundButton = document.getElementById("fundButton") as HTMLButtonElement
const balanceButton = document.getElementById("balanceButton") as HTMLButtonElement
const withdrawButton = document.getElementById("withdrawButton") as HTMLButtonElement
const ethAmountInput = document.getElementById("ethAmount") as HTMLInputElement

// Global variables with proper types
let walletClient: WalletClient | undefined
let publicClient: PublicClient | undefined

async function connect(): Promise<void> {
    if (typeof window.ethereum !== "undefined") {
        walletClient = createWalletClient({
            transport: custom(window.ethereum),
        })
        await walletClient.requestAddresses()
        connectButton.innerHTML = "Connected"
    } else {
        connectButton.innerHTML = "Please install MetaMask"
    }
}

async function fund(): Promise<void> {
    const ethAmount: string = ethAmountInput.value
    console.log(`Funding with ${ethAmount}...`)

    if (typeof window.ethereum !== "undefined") {
        try {
            walletClient = createWalletClient({
                transport: custom(window.ethereum),
            })
            const [account]: Address[] = await walletClient.requestAddresses()
            const currentChain: Chain = await getCurrentChain(walletClient)

            console.log("Processing transaction...")
            publicClient = createPublicClient({
                transport: custom(window.ethereum),
            })
            const { request } = await publicClient.simulateContract({
                address: contractAddress as Address,
                abi,
                functionName: "fund",
                account,
                chain: currentChain,
                value: parseEther(ethAmount),
            })
            const hash: Hash = await walletClient.writeContract(request)
            console.log("Transaction processed: ", hash)
        } catch (error: unknown) {
            console.log(error)
        }
    } else {
        fundButton.innerHTML = "Please install MetaMask"
    }
}

async function getBalance(): Promise<void> {
    if (typeof window.ethereum !== "undefined") {
        try {
            publicClient = createPublicClient({
                transport: custom(window.ethereum),
            })
            const balance = await publicClient.getBalance({
                address: contractAddress as Address,
            })
            console.log(formatEther(balance))
        } catch (error: unknown) {
            console.log(error)
        }
    } else {
        balanceButton.innerHTML = "Please install MetaMask"
    }
}

async function withdraw(): Promise<void> {
    console.log(`Withdrawing...`)

    if (typeof window.ethereum !== "undefined") {
        try {
            walletClient = createWalletClient({
                transport: custom(window.ethereum),
            })
            publicClient = createPublicClient({
                transport: custom(window.ethereum),
            })
            const [account]: Address[] = await walletClient.requestAddresses()
            const currentChain: Chain = await getCurrentChain(walletClient)

            console.log("Processing transaction...")
            const { request } = await publicClient.simulateContract({
                account,
                address: contractAddress as Address,
                abi,
                functionName: "withdraw",
                chain: currentChain,
            })
            const hash: Hash = await walletClient.writeContract(request)
            console.log("Transaction processed: ", hash)
        } catch (error: unknown) {
            console.log(error)
        }
    } else {
        withdrawButton.innerHTML = "Please install MetaMask"
    }
}

async function getCurrentChain(client: WalletClient): Promise<Chain> {
    const chainId: number = await client.getChainId()
    const currentChain: Chain = defineChain({
        id: chainId,
        name: "Custom Chain",
        nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: {
            default: {
                http: ["http://localhost:8545"],
            },
        },
    })
    return currentChain
}

// Event listeners with proper type assertions
connectButton.onclick = connect
fundButton.onclick = fund
balanceButton.onclick = getBalance
withdrawButton.onclick = withdraw