document.addEventListener('DOMContentLoaded', function() {
    const fileButton = document.getElementById('fileButton');
    const uploadButton = document.getElementById('uploadButton');
    const uploadStatus = document.getElementById('uploadStatus');
    const keyType = document.getElementById('keyType');
    const galleryCategory = document.getElementById('galleryCategory');
    const loadGalleryButton = document.getElementById('loadGalleryButton');
    const galleryDiv = document.getElementById('gallery');

    if (uploadButton) {
        uploadButton.addEventListener('click', async function() {
            const files = fileButton.files;
            const category = keyType.value;

            if (files.length > 0 && category !== '') {
                const promises = [];
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];

                    // Compress the image
                    try {
                        const compressedFile = await imageCompression(file, {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true
                        });

                        const storageRef = firebase.storage().ref('photos/' + compressedFile.name);
                        const uploadTask = storageRef.put(compressedFile);

                        const promise = new Promise((resolve, reject) => {
                            uploadTask.on('state_changed',
                                function(snapshot) {
                                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                    uploadStatus.textContent = `Uploading ${compressedFile.name}: ${progress}% done`;
                                },
                                function(error) {
                                    reject(error);
                                },
                                function() {
                                    uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
                                        const photoData = {
                                            url: downloadURL,
                                            name: compressedFile.name
                                        };
                                        firebase.database().ref(`${category}`).push(photoData).then(resolve).catch(reject);
                                    });
                                }
                            );
                        });
                        promises.push(promise);
                    } catch (error) {
                        uploadStatus.textContent = 'Error compressing ' + file.name + ': ' + error.message;
                    }
                }

                Promise.all(promises)
                    .then(() => {
                        uploadStatus.textContent = 'All uploads successful!';
                        fileButton.value = '';
                    })
                    .catch((error) => {
                        uploadStatus.textContent = 'Error: ' + error.message;
                    });
            } else {
                uploadStatus.textContent = 'Please select files and a category!';
            }
        });
    }

    function loadGallery(category) {
        if (galleryDiv) {
            galleryDiv.innerHTML = ''; // Hapus galeri sebelumnya
            firebase.database().ref(category).once('value').then(function(snapshot) {
                snapshot.forEach(function(childSnapshot) {
                    const photo = childSnapshot.val();
                    const imgContainer = document.createElement('div');
                    imgContainer.classList.add('img-container');
                    
                    const img = document.createElement('img');
                    img.src = photo.url;
                    img.dataset.key = childSnapshot.key;
                    img.dataset.category = category;
                    img.addEventListener('click', function() {
                        openPhotoDetails(photo, category);
                    });

                    const deleteIcon = document.createElement('i');
                    deleteIcon.classList.add('fas', 'fa-trash-alt', 'delete-icon');
                    deleteIcon.dataset.key = childSnapshot.key;
                    deleteIcon.dataset.category = category;
                    deleteIcon.addEventListener('click', function(event) {
                        event.stopPropagation();
                        deletePhoto(deleteIcon.dataset.category, deleteIcon.dataset.key, photo.name);
                    });

                    imgContainer.appendChild(img);
                    imgContainer.appendChild(deleteIcon);
                    galleryDiv.appendChild(imgContainer);
                });
            });
        }
    }

    function deletePhoto(category, key, fileName) {
        // Delete from database
        firebase.database().ref(`${category}/${key}`).remove().then(function() {
            // Delete from storage
            const storageRef = firebase.storage().ref('photos/' + fileName);
            storageRef.delete().then(function() {
                loadGallery(category); // Reload the gallery after deletion
            }).catch(function(error) {
                alert('Error deleting file: ' + error.message);
            });
        }).catch(function(error) {
            alert('Error deleting database entry: ' + error.message);
        });
    }

    function openPhotoDetails(photo, category) {
        const modal = document.getElementById('modal');
        const modalImg = document.getElementById('modalImg');
        const captionText = document.getElementById('captionText');
        
        modal.style.display = "block";
        modalImg.src = photo.url;
        captionText.innerHTML = `<strong>${photo.name}</strong><br>Category: ${category}`;
    }

    // Tutup modal
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.onclick = function() {
            const modal = document.getElementById('modal');
            modal.style.display = "none";
        };
    }

    // Tutup modal jika pengguna mengklik di luar modal
    window.onclick = function(event) {
        const modal = document.getElementById('modal');
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Event listener untuk tombol "Tampilkan Galeri"
    if (loadGalleryButton) {
        loadGalleryButton.addEventListener('click', function() {
            const category = galleryCategory.value;
            if (category) {
                loadGallery(category);
            } else {
                alert('Please select a gallery category!');
            }
        });
    }
});
