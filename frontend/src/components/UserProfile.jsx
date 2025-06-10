import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LOCAL_URL_API } from '../constants/constans';
import '../styles/UserProfile.css';


const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setError('No hay sesión activa. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      console.log('Token:', token); // Para depuración
      const response = await axios.get(`${LOCAL_URL_API}wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Response completa:', response.data); // Para depuración
      
      setUserData(response.data);

      // Si el usuario tiene una imagen de perfil en meta, obtener sus detalles
      if (response.data.meta && response.data.meta.profile_image_url) {
        setPreviewUrl(response.data.meta.profile_image_url);
      }
    } catch (err) {
      console.error('Error completo:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(`Error al cargar los datos del usuario: ${err.response.data.message || 'Error de autenticación'}`);
      } else {
        setError('Error al cargar los datos del usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setError('No hay sesión activa. Por favor, inicia sesión nuevamente.');
        return;
      }

      await axios.post(`${LOCAL_URL_API}wp-json/wp/v2/users/me`, {
        current_password: passwordForm.current_password,
        password: passwordForm.new_password
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Contraseña actualizada correctamente');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      console.error('Error completo:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(`Error al actualizar la contraseña: ${err.response.data.message || 'Error de autenticación'}`);
      } else {
        setError('Error al actualizar la contraseña');
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecciona una imagen');
      return;
    }

    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setError('No hay sesión activa. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      // Primero subimos la imagen a la biblioteca de medios
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await axios.post(
        `${LOCAL_URL_API}wp-json/wp/v2/media`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Media upload response:', uploadResponse.data);

      // Actualizamos el perfil del usuario con el ID de la imagen usando nuestro endpoint personalizado
      const updateResponse = await axios.post(
        `${LOCAL_URL_API}wp-json/pm/v1/update-profile-image`,
        {
          image_id: uploadResponse.data.id
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Profile update response:', updateResponse.data);

      // Actualizamos la vista previa con la URL de la imagen subida
      if (updateResponse.data.image_url) {
        setPreviewUrl(updateResponse.data.image_url);
      }

      setSuccess('Imagen de perfil actualizada correctamente');
    } catch (err) {
      console.error('Error completo:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(`Error al subir la imagen: ${err.response.data.message || 'Error de autenticación'}`);
      } else {
        setError('Error al subir la imagen');
      }
    }
  };

  if (loading) {
    return <div className="loading">Cargando perfil...</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h1>Mi Perfil</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-content">
        <div className="profile-section">
          <h2>Información Personal</h2>
          <div className="user-info">
            <div className="avatar-section">
              <div className="avatar-container">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Imagen de perfil" 
                    className="profile-image"
                    onError={(e) => {
                      console.error('Error al cargar la imagen:', e);
                      e.target.onerror = null;
                      e.target.src = '';
                      setPreviewUrl('');
                    }}
                  />
                ) : (
                  <div className="profile-placeholder">
                    {userData?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="profile-upload">
                <label className="upload-button">
                  Seleccionar Imagen
                  <input
                    type="file"
                    className="file-input"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
                {selectedFile && (
                  <button className="btn-upload" onClick={handleAvatarUpload}>
                    Subir Imagen
                  </button>
                )}
              </div>
            </div>
            <div className="user-details">
              <p><strong>Nombre:</strong> {userData?.name || 'No disponible'}</p>
              <p><strong>Email:</strong> {userData?.email || 'No disponible'}</p>
              <p><strong>Rol:</strong> {userData?.roles?.join(', ') || 'No disponible'}</p>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Cambiar Contraseña</h2>
          <form className="password-form" onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label htmlFor="current_password">Contraseña Actual</label>
              <input
                type="password"
                id="current_password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({
                  ...passwordForm,
                  current_password: e.target.value
                })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new_password">Nueva Contraseña</label>
              <input
                type="password"
                id="new_password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({
                  ...passwordForm,
                  new_password: e.target.value
                })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm_password">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                id="confirm_password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({
                  ...passwordForm,
                  confirm_password: e.target.value
                })}
                required
              />
            </div>
            <button type="submit" className="btn-submit">
              Cambiar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 