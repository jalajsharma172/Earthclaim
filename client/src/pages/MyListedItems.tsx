import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap'

function renderSoldItems(items) {
    return (
        <div className="sold-section mt-5">
            <div className="section-header">
                <h2 className="section-title">Sold Items</h2>
                <div className="sold-badge">{items.length} sold</div>
            </div>
            <Row xs={1} md={2} lg={4} className="g-4 py-3">
                {items.map((item, idx) => (
                    <Col key={idx} className="overflow-hidden">
                        <Card className="nft-card sold-card h-100">
                            <div className="card-image-container">
                                <Card.Img variant="top" src={item.image} className="nft-image" />
                                <div className="sold-overlay">
                                    <Badge bg="success" className="sold-tag">SOLD</Badge>
                                </div>
                            </div>
                            <Card.Body className="d-flex flex-column">
                                <Card.Title className="nft-name">{item.name}</Card.Title>
                                <Card.Text className="nft-description text-muted small">
                                    {item.description}
                                </Card.Text>
                                <div className="price-info mt-auto">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="price-label">Final Price</span>
                                        <span className="price-value fw-bold text-success">
                                            {ethers.utils.formatEther(item.totalPrice)} ETH
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mt-1">
                                        <span className="price-label">You Received</span>
                                        <span className="price-value">
                                            {ethers.utils.formatEther(item.price)} ETH
                                        </span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    )
}

export default function MyListedItems({ marketplace, nft, account }) {
    const [loading, setLoading] = useState(true)
    const [listedItems, setListedItems] = useState([])
    const [soldItems, setSoldItems] = useState([])

    const loadListedItems = async () => {
        // Load all sold items that the user listed
        const itemCount = await marketplace.itemCount()
        console.log("itemCount as String: -> " , itemCount.toString());

        if(1 <= itemCount){
            console.log("True");
        } else {
            console.log("False");
        }
        let listedItems = []
        let soldItems = []
        for (let indx = 1; indx <= itemCount; indx++) {
            const i = await marketplace.items(indx)
            console.log(i.seller.toLowerCase());
            console.log("Account : ",account[0]);
            
            if (i.seller.toLowerCase() === account[0]) {
                console.log(indx);
                // get uri url from nft contract
                const uri = await nft.tokenURI(i.tokenId)
                // use uri to fetch the nft metadata stored on ipfs
                const response = await fetch(uri)
                const metadata = await response.json()
                // get total price of item (item price + fee)
                const totalPrice = await marketplace.getTotalPrice(i.itemId)
                // define listed item object
                let item = {
                    totalPrice,
                    price: i.price,
                    indx,
                    itemId: i.itemId,
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image
                }
                listedItems.push(item)
                // Add listed item to sold items array if sold
                if (i.sold) soldItems.push(item)
            }
        }
        setLoading(false)
        setListedItems(listedItems)
        console.log("listedItems: ", listedItems);
        setSoldItems(soldItems)
        console.log("soldItems: ",soldItems);
    }

    useEffect(() => {
        loadListedItems()
    }, [])

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-50">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" className="mb-3" style={{width: '3rem', height: '3rem'}} />
                    <h4 className="text-muted">Loading your NFTs...</h4>
                </div>
            </div>
        )
    }

    return (
        <div className="my-listed-items-container">
            <div className="page-header mb-5">
                <h1 className="page-title">My Listed Items</h1>
                <p className="page-subtitle text-muted">Manage your NFT listings and track sales</p>
            </div>

            {listedItems.length > 0 ? (
                <div className="container-fluid px-4">
                    {/* Stats Overview */}
                    <Row className="stats-overview mb-5">
                        <Col md={4}>
                            <div className="stat-card text-center p-4 rounded-3">
                                <h3 className="stat-number text-primary">{listedItems.length}</h3>
                                <p className="stat-label text-muted mb-0">Total Listed</p>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="stat-card text-center p-4 rounded-3">
                                <h3 className="stat-number text-warning">{listedItems.length - soldItems.length}</h3>
                                <p className="stat-label text-muted mb-0">Currently Listed</p>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="stat-card text-center p-4 rounded-3">
                                <h3 className="stat-number text-success">{soldItems.length}</h3>
                                <p className="stat-label text-muted mb-0">Total Sold</p>
                            </div>
                        </Col>
                    </Row>

                    {/* Currently Listed Items */}
                    <div className="listed-section">
                        <div className="section-header mb-4">
                            <h2 className="section-title">Currently Listed</h2>
                            <Badge bg="primary" className="listing-badge">
                                {listedItems.length - soldItems.length} active
                            </Badge>
                        </div>
                        
                        {listedItems.filter(item => !soldItems.includes(item)).length > 0 ? (
                            <Row xs={1} md={2} lg={4} className="g-4">
                                {listedItems.filter(item => !soldItems.includes(item)).map((item, idx) => (
                                    <Col key={idx} className="overflow-hidden">
                                        <Card className="nft-card active-listing h-100">
                                            <div className="card-image-container">
                                                <Card.Img variant="top" src={item.image} className="nft-image" />
                                                <div className="listing-overlay">
                                                    <Badge bg="primary" className="listing-tag">LISTED</Badge>
                                                </div>
                                            </div>
                                            <Card.Body className="d-flex flex-column">
                                                <Card.Title className="nft-name">{item.name}</Card.Title>
                                                <Card.Text className="nft-description text-muted small">
                                                    {item.description}
                                                </Card.Text>
                                                <div className="price-section mt-auto">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className="price-label">Price</span>
                                                        <span className="price-value fw-bold text-primary">
                                                            {ethers.utils.formatEther(item.totalPrice)} ETH
                                                        </span>
                                                    </div>
                                                    <small className="text-muted">Including marketplace fee</small>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            <Alert variant="info" className="text-center">
                                <i className="fas fa-info-circle me-2"></i>
                                All your listed items have been sold! 🎉
                            </Alert>
                        )}
                    </div>

                    {/* Sold Items */}
                    {soldItems.length > 0 && renderSoldItems(soldItems)}
                </div>
            ) : (
                <div className="empty-state text-center py-5">
                    <div className="empty-icon mb-4">
                        <i className="fas fa-box-open text-muted" style={{fontSize: '4rem'}}></i>
                    </div>
                    <h3 className="empty-title mb-3">No NFTs Listed</h3>
                    <p className="empty-description text-muted mb-4">
                        You haven't listed any NFTs for sale yet. Start by listing your first NFT!
                    </p>
                    <button className="btn btn-primary btn-lg">
                        List Your First NFT
                    </button>
                </div>
            )}

            <style jsx>{`
                .my-listed-items-container {
                    min-height: 80vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 2rem 0;
                }

                .page-header {
                    text-align: center;
                    color: white;
                }

                .page-title {
                    font-size: 3rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .page-subtitle {
                    font-size: 1.2rem;
                    opacity: 0.9;
                }

                .container-fluid {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    margin-top: 2rem;
                }

                .stat-card {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    transition: all 0.3s ease;
                }

                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }

                .stat-number {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                }

                .nft-card {
                    border: none;
                    border-radius: 15px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                    overflow: hidden;
                }

                .nft-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 25px rgba(0,0,0,0.15);
                }

                .card-image-container {
                    position: relative;
                    overflow: hidden;
                }

                .nft-image {
                    height: 250px;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .nft-card:hover .nft-image {
                    transform: scale(1.05);
                }

                .listing-overlay, .sold-overlay {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                }

                .listing-tag, .sold-tag {
                    font-size: 0.8rem;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                }

                .sold-card {
                    opacity: 0.85;
                }

                .sold-card:hover {
                    opacity: 1;
                }

                .nft-name {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }

                .nft-description {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .price-section, .price-info {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 10px;
                    margin-top: auto;
                }

                .price-label {
                    font-size: 0.9rem;
                    color: #6c757d;
                }

                .price-value {
                    font-size: 1.1rem;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #e9ecef;
                }

                .section-title {
                    font-size: 2rem;
                    font-weight: 600;
                    color: #2c3e50;
                    margin: 0;
                }

                .listing-badge, .sold-badge {
                    font-size: 1rem;
                    padding: 0.5rem 1.5rem;
                }

                .empty-state {
                    background: white;
                    border-radius: 20px;
                    padding: 4rem 2rem;
                    margin: 2rem auto;
                    max-width: 600px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }

                .empty-title {
                    color: #2c3e50;
                    font-weight: 600;
                }

                @media (max-width: 768px) {
                    .page-title {
                        font-size: 2rem;
                    }
                    
                    .section-header {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }
                    
                    .stat-number {
                        font-size: 2rem;
                    }
                }
            `}</style>
        </div>
    );
}