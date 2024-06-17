document.addEventListener('DOMContentLoaded', function () {
    // Get the modal
    var modal = document.getElementById("configModal");
    var span = document.getElementsByClassName("close")[0];

    // Set the modal title and version
    document.getElementById('modalTitle').textContent = window.buildConfig.title;
    document.getElementById('modalVersion').textContent = window.buildConfig.version;

    // Display component IDs and formulas in the modal
    var componentList = document.getElementById("componentList");
    window.buildConfig.components.forEach(function(component) {
        var li = document.createElement("li");
        li.innerHTML = `
            ${component.id}
            <div class="formula">${component.formula}</div>
        `;
        componentList.appendChild(li);

        li.addEventListener('click', function() {
            var formula = this.querySelector('.formula');
            if (formula.style.display === 'none' || formula.style.display === '') {
                formula.style.display = 'block';
            } else {
                formula.style.display = 'none';
            }
        });
    });

    // Show the modal onload
    modal.style.display = "block";

    // Close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // Close the modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Close the modal when the run button is clicked
    document.getElementById('run').addEventListener('click', function() {
        modal.style.display = "none";
    });

    // Update file names when files are chosen
    document.getElementById('csvPipe').addEventListener('change', function() {
        var fileNames = Array.from(this.files).map(file => file.name).join(', ');
        document.getElementById('fileNames').textContent = fileNames || 'No file chosen';
    });
});