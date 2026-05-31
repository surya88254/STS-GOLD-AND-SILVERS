import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";
import "../styles/Profile.css";

function Profile() {
	const navigate = useNavigate();
	const [profile, setProfile] = useState(null);
	const [orders, setOrders] = useState([]);
	const [customRequests, setCustomRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [photoFile, setPhotoFile] = useState(null);
	const [photoPreview, setPhotoPreview] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [editOpen, setEditOpen] = useState(false);

	useEffect(() => {
		const loadProfile = async () => {
			const { data: sessionData } = await supabase.auth.getSession();
			const userId = sessionData?.session?.user?.id;
			if (!userId) {
				navigate("/login");
				return;
			}

			const [{ data: profileData, error: profileError }, { data: ordersData, error: ordersError }, { data: customData, error: customError }] = await Promise.all([
				supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
				supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
				supabase.from("custom_design_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
			]);

			if (profileError) {
				setErrorMessage(profileError.message || "Unable to load profile.");
			} else {
				setProfile(profileData);
				setName(profileData.full_name || "");
				setPhone(profileData.phone || "");
				setPhotoPreview(profileData.profile_photo || null);
			}

			if (ordersError) {
				setErrorMessage(ordersError.message || "Unable to load orders.");
			} else if (ordersData) {
				const productIds = ordersData.map((order) => order.product_id).filter(Boolean);
				let productMap = {};

				if (productIds.length > 0) {
					const { data: productData } = await supabase
						.from("products")
						.select("id, name, image_url, price")
						["in"]("id", productIds);

					productMap = (productData || []).reduce((acc, item) => {
						acc[item.id] = item;
						return acc;
					}, {});
				}

				const enrichedOrders = ordersData.map((order) => ({
					...order,
					product: productMap[order.product_id] || null,
				}));

				setOrders(enrichedOrders);
			}

			if (customError) {
				console.log("Unable to load custom requests:", customError.message);
			} else if (customData) {
				setCustomRequests(customData);
			}

			setLoading(false);
		};

		loadProfile();
	}, [navigate]);

	const handlePhotoChange = (event) => {
		const file = event.target.files[0];
		if (!file) return;
		setPhotoFile(file);
		setPhotoPreview(URL.createObjectURL(file));
	};

	const openEditPanel = () => {
		setErrorMessage("");
		setSuccessMessage("");
		setName(profile?.full_name || "");
		setPhone(profile?.phone || "");
		setPhotoPreview(profile?.profile_photo || "/assets/default-avatar.png");
		setPhotoFile(null);
		setEditOpen(true);
	};

	const closeEditPanel = () => {
		setEditOpen(false);
		setErrorMessage("");
		setSuccessMessage("");
		setPhotoFile(null);
		setPhotoPreview(profile?.profile_photo || "/assets/default-avatar.png");
		setName(profile?.full_name || "");
		setPhone(profile?.phone || "");
	};

	const handleSave = async (event) => {
		event.preventDefault();
		setErrorMessage("");
		setSuccessMessage("");
		setSaving(true);

		const { data: sessionData } = await supabase.auth.getSession();
		const userId = sessionData?.session?.user?.id;

		if (!userId) {
			setErrorMessage("You must be logged in to update your profile.");
			setSaving(false);
			return;
		}

		let photoUrl = profile?.profile_photo || null;

		if (photoFile) {
			setUploading(true);
			const filePath = `${userId}/${Date.now()}-${photoFile.name}`;
			const { error: uploadError } = await supabase.storage
			  .from("product-images")
			  .upload(filePath, photoFile, {
				cacheControl: "3600",
				upsert: true,
			});

			if (uploadError) {
				setErrorMessage(uploadError.message || "Photo upload failed.");
				setUploading(false);
				setSaving(false);
				return;
			}

			const { data: urlData } = supabase.storage
			  .from("product-images")
			  .getPublicUrl(filePath);
			photoUrl = urlData.publicUrl;
			setUploading(false);
		}

		const { error } = await supabase.from("profiles").upsert([
			{
				id: userId,
				full_name: name.trim(),
				phone: phone.trim(),
				profile_photo: photoUrl,
			},
		]);

		if (error) {
			setErrorMessage(error.message || "Unable to save profile.");
			setSaving(false);
			return;
		}

		setProfile((prev) => ({
			...prev,
			full_name: name.trim(),
			phone: phone.trim(),
			profile_photo: photoUrl,
		}));
		setPhotoPreview(photoUrl || "/assets/default-avatar.png");
		setSuccessMessage("Profile updated successfully.");
		setSaving(false);
		setEditOpen(false);
	};

	return (
		<div className="profile-page">
			<Navbar />
			<div className="profile-container">
				<div className="profile-header">
					<div>
						<span className="profile-tag">My Profile</span>
						<h1>Welcome to your luxury dashboard</h1>
						<p>Manage your information and review every premium order in one space.</p>
					</div>

					<section className="custom-requests-section glass-panel">
						<div className="orders-header">
							<span className="profile-tag">Custom Designs</span>
							<h2>My Custom Design Requests</h2>
						</div>

						<div className="custom-requests-list">
							{loading ? (
								<div className="orders-loading">Loading requests...</div>
							) : customRequests.length === 0 ? (
								<div className="orders-empty">
									No custom design requests yet. {" "}
									<button className="quick-action" onClick={() => navigate("/gold") }>
										Create one now
									</button>
								</div>
							) : (
								customRequests.map((request) => (
									<div className="custom-request-card" key={request.id}>
										<div className="request-media">
											{request.reference_image ? (
												<img src={request.reference_image} alt="Design reference" />
											) : (
												<div className="no-image">No Image</div>
											)}
										</div>
										<div className="request-content">
											<div className="request-top">
												<div>
													<h3>{request.jewelry_type}</h3>
													<p className="request-design-type">{request.design_type}</p>
												</div>
												<div>
													<span className={`request-status status-${request.status?.toLowerCase() || "pending"}`}>
														{request.status || "Pending"}
													</span>
												</div>
											</div>
											<div className="request-details">
												<div className="detail-item">
													<span className="label">Weight:</span>
													<span>{request.weight || "-"}</span>
												</div>
												<div className="detail-item">
													<span className="label">Budget:</span>
													<span>{request.budget || "-"}</span>
												</div>
												<div className="detail-item">
													<span className="label">Requested:</span>
													<span>{request.created_at ? new Date(request.created_at).toLocaleDateString() : "-"}</span>
												</div>
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</section>
				</div>

				<div className="profile-grid">
					<section className="profile-card glass-panel">
						{successMessage && <div className="profile-notice success">{successMessage}</div>}
						{errorMessage && <div className="profile-notice error">{errorMessage}</div>}

						<div className="profile-summary">
							<div className="avatar-card">
								<img
									className="profile-avatar"
									src={photoPreview || "/assets/default-avatar.png"}
									alt="Profile"
								/>
							</div>
							<div className="profile-details">
								<p className="label">Full Name</p>
								<h2>{profile?.full_name || "-"}</h2>
								<p className="label">Email</p>
								<p>{profile?.email || "-"}</p>
								<p className="label">Phone</p>
								<p>{profile?.phone || "-"}</p>
								<p className="label">Member Since</p>
								<p>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"}</p>
							</div>
						</div>

						<button className="edit-profile-button" type="button" onClick={openEditPanel}>
							Edit Profile
						</button>
					</section>

					<section className="orders-card glass-panel">
						<div className="orders-header">
							<span className="profile-tag">My Orders</span>
							<h2>Luxury Order History</h2>
						</div>

						<div className="orders-list">
							{loading ? (
								<div className="orders-loading">Loading orders...</div>
							) : orders.length === 0 ? (
								<div className="orders-empty">No orders yet. Place your first luxury order.</div>
							) : (
								orders.map((order) => (
									<div className="order-card" key={order.id}>
										<div className="order-media">
											<img
												src={order.product?.image_url || profile?.profile_photo || "/assets/default-avatar.png"}
												alt={order.product?.name || "Order item"}
											/>
										</div>
										<div className="order-content">
											<div className="order-top">
												<div>
													<h3>{order.product?.name || "Premium item"}</h3>
													<span className={`order-status ${order.order_status?.toLowerCase()}`}>
														{order.order_status || "Pending"}
													</span>
												</div>
												<div className="order-meta">
													<span>{order.created_at ? new Date(order.created_at).toLocaleDateString() : "-"}</span>
													<span>Qty: {order.quantity || 1}</span>
												</div>
											</div>
											<div className="order-detail-row">
												<p>Payment</p>
												<strong>{order.payment_method || "COD"}</strong>
											</div>
											<div className="order-detail-row">
												<p>Price</p>
												<strong>{"\u20B9"} {order.product?.price ? Number(order.product.price).toLocaleString() : "-"}</strong>
											</div>
										</div>
										<div className="order-actions">
											<button
												type="button"
												className="order-view-button"
												onClick={() => order.product_id && navigate(`/product/${order.product_id}`)}
											>
												View Order
											</button>
										</div>
									</div>
								))
							)}
						</div>
					</section>
				</div>
			</div>

			{editOpen && (
				<div className="edit-modal-overlay" onClick={closeEditPanel}>
					<div className="edit-modal glass-panel" onClick={(event) => event.stopPropagation()}>
						<div className="edit-modal-header">
							<div>
								<span className="profile-tag">Edit Profile</span>
								<h3>Refine your premium profile</h3>
								<p>Update your name, phone, and profile image in a discreet luxury panel.</p>
							</div>
							<button className="modal-close" type="button" onClick={closeEditPanel}>
								×
							</button>
						</div>

						<form className="edit-form" onSubmit={handleSave}>
							<label>
								Full Name
								<input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
							</label>
							<label>
								Phone Number
								<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
							</label>
							<label className="profile-photo-upload">
								Upload Profile Photo
								<input type="file" accept="image/*" onChange={handlePhotoChange} />
							</label>
							<div className="edit-actions">
								<button type="button" className="cancel-button" onClick={closeEditPanel}>
									Cancel
								</button>
								<button type="submit" className="profile-button" disabled={saving || uploading}>
									{saving ? "Saving Changes..." : "Save Changes"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

export default Profile;

