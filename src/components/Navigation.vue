<template>
    <nav>
        <ul>
            <li :class="{ active: currentTab === 'Popup' }" @click="$emit('change-tab', 'Popup')">Test Case</li>
            <li :class="{ active: currentTab === 'PopupTaskForm' }" @click="$emit('change-tab', 'PopupTaskForm')">Task Form
            </li>
        </ul>
    </nav>
</template>

<script>
export default {
    props: {
        currentTab: String,
    },
};
</script>
  
<style>
nav {
    background-color: #eee;
    height: 30px;
    /* change to your desired height */
}

ul {
    display: flex;
    justify-content: space-between;
    list-style: none;
    margin: 0;
    padding: 0;
}

li {
    cursor: pointer;
    font-weight: bold;
    padding: 0.5rem;
    text-align: center;
    text-transform: uppercase;
    transition: background-color 0.3s ease-in-out;
}

li.active,
li:hover {
    background-color: #ddd;
}
</style>
  