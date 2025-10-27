import React, { useState } from 'react'
import { ethers } from 'ethers'

interface CreateProps {
  marketplace: any
  nft: any
}

const Create = ({ marketplace, nft }: CreateProps) => {
  const [price, setPrice] = useState<string>('')
  const [tokenId, setTokenID] = useState<string>('')
  const [tokenaddress, setTokenAddress] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validate = () => {
    if (!tokenId.trim()) {
      setError('Token ID is required')
      return false
    }
    if (!tokenaddress.trim()) {
      setError('Token contract address is required')
      return false
    }
    if (!price || Number(price) <= 0) {
      setError('Please enter a valid price')
      return false
    }
    setError(null)
    return true
  }

  const createNFT = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!validate()) return

    if (!marketplace) {
      setError('Marketplace contract is not connected')
      return
    }

    try {
      setIsLoading(true)
      setMessage(null)
      const listingPrice = (ethers as any).parseEther(price.toString())

      const tx = await marketplace.makeItem(tokenaddress, tokenId, listingPrice)
      setMessage('Transaction sent — waiting for confirmation...')
      await tx.wait()
      setMessage('NFT listed successfully!')

      setTokenAddress('')
      setTokenID('')
      setPrice('')
    } catch (err: any) {
      console.error('Error listing NFT:', err)
      setError(err?.message || 'Failed to list NFT')
    } finally {
      setIsLoading(false)
    }
  }

  const clearForm = () => {
    setTokenAddress('')
    setTokenID('')
    setPrice('')
    setError(null)
    setMessage(null)
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 font-mono border-b-4 border-cyan-400 pb-2 inline-block">
            ⚡ FORGE NFT
          </h1>
          <p className="text-cyan-300 font-mono text-lg">
            List Your Digital Territory on the Marketplace
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 bg-opacity-50 rounded-lg border border-cyan-400 p-6 relative">
            {/* Corner Decorations */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>

            {/* Status Messages */}
            {message && (
              <div className="mb-6 p-4 bg-green-900 bg-opacity-50 border border-green-400 rounded text-green-300 font-mono">
                <div className="flex items-center">
                  <span className="text-lg mr-2">✅</span>
                  {message}
                </div>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-400 rounded text-red-300 font-mono">
                <div className="flex items-center">
                  <span className="text-lg mr-2">⚠️</span>
                  {error}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={createNFT} className="space-y-6">
              {/* Token ID Input */}
              <div>
                <label className="block text-cyan-300 font-mono text-sm uppercase tracking-wide mb-2">
                  🆔 TOKEN ID
                </label>
                <input
                  type="text"
                  placeholder="Enter token ID"
                  value={tokenId}
                  onChange={(e) => setTokenID(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50"
                />
              </div>

              {/* Token Address Input */}
              <div>
                <label className="block text-cyan-300 font-mono text-sm uppercase tracking-wide mb-2">
                  📍 CONTRACT ADDRESS
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={tokenaddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50"
                />
              </div>

              {/* Price Input */}
              <div>
                <label className="block text-cyan-300 font-mono text-sm uppercase tracking-wide mb-2">
                  💰 PRICE (ETH)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono placeholder-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={clearForm}
                  disabled={isLoading}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-mono py-3 px-6 rounded-lg border border-gray-500 hover:border-gray-400 transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                >
                  <span className="mr-2">🗑️</span>
                  CLEAR FIELDS
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-mono py-3 px-6 rounded-lg border border-cyan-400 hover:border-cyan-300 transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      FORGING NFT...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">⚡</span>
                      FORGE NFT
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info Panel */}
          <div className="mt-6 bg-black bg-opacity-50 rounded-lg border border-gray-600 p-4">
            <div className="text-cyan-300 font-mono text-sm">
              <div className="flex items-center mb-2">
                <span className="mr-2">ℹ️</span>
                <strong>FORGE PROCESS:</strong>
              </div>
              <ul className="text-gray-300 space-y-1 ml-6">
                <li>• Enter valid Token ID and Contract Address</li>
                <li>• Set your desired price in ETH</li>
                <li>• Confirm transaction in your wallet</li>
                <li>• Wait for blockchain confirmation</li>
              </ul>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="mt-8 bg-black bg-opacity-70 rounded-lg border border-cyan-400 py-3">
            <div className="max-w-2xl mx-auto flex justify-between text-cyan-400 font-mono text-sm px-4">
              <div>🔧 FORGE READY</div>
              <div>🌐 POLYGON NETWORK</div>
              <div>⚡ GAS OPTIMIZED</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Create

// import React, { useState } from 'react'
// import { Form, Button, Alert } from 'react-bootstrap';
// import { ethers } from 'ethers'

// interface CreateProps {
//   marketplace: any
//   nft: any
// }

// const Create = ({ marketplace, nft }: CreateProps) => {
//   const [price, setPrice] = useState<string>('')
//   const [tokenId, setTokenID] = useState<string>('')
//   const [tokenaddress, setTokenAddress] = useState<string>('')
//   const [isLoading, setIsLoading] = useState<boolean>(false)
//   const [message, setMessage] = useState<string | null>(null)
//   const [error, setError] = useState<string | null>(null)

//   const validate = () => {
//     if (!tokenId.trim()) {
//       setError('Token ID is required')
//       return false
//     }
//     if (!tokenaddress.trim()) {
//       setError('Token contract address is required')
//       return false
//     }
//     if (!price || Number(price) <= 0) {
//       setError('Please enter a valid price')
//       return false
//     }
//     setError(null)
//     return true
//   }

//   const createNFT = async (e?: React.FormEvent) => {
//     if (e) e.preventDefault()
//     if (!validate()) return

//     if (!marketplace) {
//       setError('Marketplace contract is not connected')
//       return
//     }

//     try {
//       setIsLoading(true)
//       setMessage(null)
//       // ethers v6: parseEther is a direct export
//       const listingPrice = (ethers as any).parseEther(price.toString())

//       // call marketplace contract to list item
//       const tx = await marketplace.makeItem(tokenaddress, tokenId, listingPrice)
//       setMessage('Transaction sent — waiting for confirmation...')
//       await tx.wait()
//       setMessage('NFT listed successfully!')

//       // reset form
//       setTokenAddress('')
//       setTokenID('')
//       setPrice('')
//     } catch (err: any) {
//       console.error('Error listing NFT:', err)
//       setError(err?.message || 'Failed to list NFT')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="container-fluid mt-5">
//       <div className="row">
//         <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '700px' }}>
//           <div className="content mx-auto">
//             <h3 className="mb-4">List an NFT</h3>

//             {message && <Alert variant="success">{message}</Alert>}
//             {error && <Alert variant="danger">{error}</Alert>}

//             <Form onSubmit={createNFT}>
//               <Form.Group className="mb-3" controlId="tokenId">
//                 <Form.Label>Token ID</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="Enter token ID"
//                   value={tokenId}
//                   onChange={(e) => setTokenID(e.target.value)}
//                   disabled={isLoading}
//                   required
//                 />
//               </Form.Group>

//               <Form.Group className="mb-3" controlId="tokenAddress">
//                 <Form.Label>Token Contract Address</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="0x..."
//                   value={tokenaddress}
//                   onChange={(e) => setTokenAddress(e.target.value)}
//                   disabled={isLoading}
//                   required
//                 />
//               </Form.Group>

//               <Form.Group className="mb-3" controlId="price">
//                 <Form.Label>Price (ETH)</Form.Label>
//                 <Form.Control
//                   type="number"
//                   step="0.0001"
//                   min="0"
//                   placeholder="0.01"
//                   value={price}
//                   onChange={(e) => setPrice(e.target.value)}
//                   disabled={isLoading}
//                   required
//                 />
//               </Form.Group>

//               <div className="d-grid gap-2 d-md-flex justify-content-md-end">
//                 <Button variant="outline-secondary" disabled={isLoading} onClick={() => { setTokenAddress(''); setTokenID(''); setPrice(''); setError(null); setMessage(null); }}>
//                   Clear
//                 </Button>
//                 <Button type="submit" variant="primary" disabled={isLoading}>
//                   {isLoading ? 'Listing...' : 'List NFT'}
//                 </Button>
//               </div>
//             </Form>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }

// export default Create